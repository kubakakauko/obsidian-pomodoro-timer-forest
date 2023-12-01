import { derived, writable, type Readable, type Writable } from 'svelte/store'
import { settings, plugin } from 'stores'
import { bell } from 'Bell'
// @ts-ignore
import Worker from 'clock.worker'

import {
    getDailyNote,
    createDailyNote,
    getAllDailyNotes,
} from 'obsidian-daily-notes-interface'
import { Notice, type TFile, moment } from 'obsidian'
import type PomodoroTimerPlugin from 'main'
import { type Moment } from 'moment'

let $plugin: PomodoroTimerPlugin
let clock: Worker = Worker()
plugin.subscribe((p) => ($plugin = p))
const audio = new Audio(bell)

interface TimerState {
    autostart: boolean
    running: boolean
    lastTick: number
    mode: Mode
    elapsed: number
    startTime: number | null
    inSession: boolean
    workLen: number
    breakLen: number
    count: number
    duration: number
}

const state: Writable<TimerState> | TimerStore = writable({
    autostart: false,
    running: false,
    lastTick: 0,
    mode: 'WORK',
    elapsed: 0,
    startTime: null,
    inSession: false,
    workLen: 25,
    breakLen: 5,
    count: 25 * 60 * 1000,
    duration: 25,
})

let running = false

state.subscribe((s) => (running = s.running))

interface TimerControl {
    start: () => void
    tick: (t: number) => void
    endSession: (state: TimerState) => TimerState
    reset: () => void
    pause: () => void
    timeup: () => void
    toggleMode: (callback?: (state: TimerState) => void) => void
    toggleTimer: () => void
}

export type TimerStore = Writable<TimerState> & TimerControl

const { update } = state

settings.subscribe(($settings) => {
    update((state) => {
        state.workLen = $settings.workLen
        state.breakLen = $settings.breakLen
        state.autostart = $settings.autostart
        if (!state.running && !state.inSession) {
            state.duration =
                state.mode == 'WORK' ? state.workLen : state.breakLen
            state.count = state.duration * 60 * 1000
        }
        return state
    })
})

const methods: TimerControl = {
    toggleTimer() {
        running ? this.pause() : this.start()
    },
    start() {
        update((s) => {
            let now = new Date().getTime()
            if (!s.inSession) {
                // new session
                s.elapsed = 0
                s.duration = s.mode === 'WORK' ? s.workLen : s.breakLen
                s.count = s.duration * 60 * 1000
                s.startTime = now
            }
            s.lastTick = now
            s.inSession = true
            s.running = true
            clock.postMessage(true)
            return s
        })
    },
    pause() {
        update((s) => {
            s.running = false
            clock.postMessage(false)
            return s
        })
    },
    reset() {
        update((s) => {
            s.duration = s.mode == 'WORK' ? s.workLen : s.breakLen
            s.count = s.duration * 60 * 1000
            s.inSession = false
            s.running = false
            clock.postMessage(false)
            s.startTime = null
            s.elapsed = 0
            return s
        })
    },
    toggleMode(callback?: (state: TimerState) => void) {
        update((s) => {
            let updated = this.endSession(s)
            if (callback) {
                callback(updated)
            }
            return updated
        })
    },
    tick(t: number) {
        let timeup: boolean = false
        let pause: boolean = false
        update((s) => {
            if (s.running && s.lastTick) {
                let diff = t - s.lastTick
                s.lastTick = t
                s.elapsed += diff
                if (s.elapsed >= s.count) {
                    s.elapsed = s.count
                }
                timeup = s.elapsed >= s.count
            } else {
                pause = true
            }
            return s
        })
        if (!pause && timeup) {
            this.timeup()
        }
    },
    timeup() {
        let autostart = false
        update((s) => {
            let log = new TimerLog(
                s.mode,
                s.duration,
                moment(s.startTime),
                moment(),
            )
            notify(log)
            saveLog(log)
            autostart = s.autostart
            return this.endSession(s)
        })
        if (autostart) {
            this.start()
        }
    },
    endSession(s: TimerState) {
        if (s.breakLen == 0) {
            s.mode = 'WORK'
        } else {
            s.mode = s.mode == 'WORK' ? 'BREAK' : 'WORK'
        }
        s.duration = s.mode == 'WORK' ? s.workLen : s.breakLen
        s.count = s.duration * 60 * 1000
        s.inSession = false
        s.running = false
        clock.postMessage(false)
        s.startTime = null
        s.elapsed = 0
        return s
    },
}
export class TimerLog {
    static EMOJI: Record<Mode, string> = {
        WORK: '🍅',
        BREAK: '🥤',
    }

    static template: string =
        '(pomodoro::{mode}) (duration:: {duration}m) (begin:: {begin|YYYY-MM-DD HH:mm}) - (end:: {end|YYYY-MM-DD HH:mm})'

    duration: number
    begin: Moment
    end: Moment
    mode: Mode

    constructor(mode: Mode, duration: number, begin: Moment, end: Moment) {
        this.duration = duration
        this.begin = begin
        this.end = end
        this.mode = mode
    }

    text(): string {
        let template = TimerLog.template
        let emoji = TimerLog.EMOJI[this.mode]
        let line = template
            ? template.replace(/\{(.*?)}/g, (_, expression: string): string => {
                  let [key, format]: string[] = expression
                      .split('|')
                      .map((part: string) => part.trim())
                  let value = this[key as keyof TimerLog] || ''

                  // Check if the value is a moment object and a format is provided
                  if (moment.isMoment(value) && format) {
                      return value.format(format)
                  }
                  return (value as string) || ''
              })
            : ''
        return `- ${emoji} ${line}`
    }
}

const saveLog = async (log: TimerLog): Promise<void> => {
    const settings = $plugin!.getSettings()
    if (settings.logFile === 'DAILY') {
        let file = (await getDailyNoteFile()).path
        await appendFile(file, `\n${log.text()}`)
    }
    if (settings.logFile === 'FILE') {
        let path = settings.logPath || settings.logPath.trim()
        if (path !== '') {
            await ensureFolderExists(path)
            if (!(await $plugin!.app.vault.adapter.exists(path))) {
                await $plugin!.app.vault.create(path, log.text())
            } else {
                await appendFile(path, `\n${log.text()}`)
            }
        }
    }
}

const ensureFolderExists = async (path: string): Promise<void> => {
    const dirs = path.replace(/\\/g, '/').split('/')
    dirs.pop() // remove basename

    if (dirs.length) {
        const dir = join(...dirs)
        if (!$plugin.app.vault.getAbstractFileByPath(dir)) {
            await $plugin.app.vault.createFolder(dir)
        }
    }
}

const join = (...partSegments: string[]): string => {
    // Split the inputs into a list of path commands.
    let parts: string[] = []
    for (let i = 0, l = partSegments.length; i < l; i++) {
        parts = parts.concat(partSegments[i].split('/'))
    }
    // Interpret the path commands to get the new resolved path.
    const newParts = []
    for (let i = 0, l = parts.length; i < l; i++) {
        const part = parts[i]
        // Remove leading and trailing slashes
        // Also remove "." segments
        if (!part || part === '.') continue
        // Push new path segments.
        else newParts.push(part)
    }
    // Preserve the initial slash if there was one.
    if (parts[0] === '') newParts.unshift('')
    // Turn back into a single string path.
    return newParts.join('/')
}

const getDailyNoteFile = async (): Promise<TFile> => {
    const file = getDailyNote(moment() as any, getAllDailyNotes())
    if (!file) {
        return await createDailyNote(moment() as any)
    }
    return file
}

const appendFile = async (filePath: string, logText: string): Promise<void> => {
    await $plugin!.app.vault.adapter.append(filePath, logText)
}

const notify = (log: TimerLog) => {
    const text = `${TimerLog.EMOJI[log.mode]} You have been ${
        log.mode === 'WORK' ? 'working' : 'breaking'
    } for ${log.duration} minutes.`
    ring()
    new Notice(`${text}`)
}

const ring = () => {
    audio.play()
}

Object.keys(methods).forEach((key) => {
    let method = key as keyof TimerControl
    ;(state as any)[method] = methods[method].bind(state)
})

export type TimerRemained = {
    millis: number
    human: string
}

export const remained: Readable<TimerRemained> = derived(
    state as Writable<TimerState>,
    ($state) => {
        let remained = $state.count - $state.elapsed
        let min = Math.floor(remained / 60000)
        let sec = Math.floor((remained % 60000) / 1000)
        let minStr = min < 10 ? `0${min}` : min.toString()
        let secStr = sec < 10 ? `0${sec}` : sec.toString()

        return {
            millis: remained,
            human: `${minStr} : ${secStr}`,
        } as TimerRemained
    },
)

export const store = state as TimerStore

clock.onmessage = ({ data }: any) => {
    store.tick(data as number)
}
export type Mode = 'WORK' | 'BREAK'
