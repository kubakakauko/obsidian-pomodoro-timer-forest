<script lang="ts">
import TasksComponent from 'TasksComponent.svelte'
import TimerSettingsComponent from 'TimerSettingsComponent.svelte'
import type Timer from 'Timer'
import type Tasks from 'Tasks'
import type TaskTracker from 'TaskTracker'
import ForestComponent from './forest/ForestComponent.svelte'
export let timer: Timer
export let tasks: Tasks
export let tracker: TaskTracker
export let render: (content: string, el: HTMLElement) => void

let extra: 'settings' | 'forest' | 'tasks' | 'close' = 'tasks'
const offset = 440

$: strokeOffset = ($timer.remained.millis / $timer.count) * offset

const start = () => {
    if (!$timer.running) {
        timer.start()
    }
}

const reset = () => {
    timer.reset()
}

const pause = () => {
    if ($timer.running) {
        timer.pause()
    }
}

const toggleTimer = () => {
    timer.toggleTimer()
}

const toggleMode = () => {
    timer.toggleMode()
}

const toggleExtra = (value: 'settings' | 'tasks' | 'forest') => {
    if (extra === value) {
        extra = 'close'
        return
    }
    extra = value
}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="container">
    <div class="main">
        <div class="timer">
            <div class="timer-display">
                <div class="status control" on:click={toggleMode}>
                    {#if $timer.running}<span class="breath"></span>{/if}
                    {#if $timer.mode === 'WORK'}
                        <span class="mode">Work</span>
                    {:else}
                        <span class="mode">Break</span>
                    {/if}
                    <span></span>
                </div>
                <div on:click={toggleTimer} class="control">
                    <span class="timer-text">
                        {$timer.remained.human}
                    </span>
                </div>
            </div>
            <svg
                class="timer"
                width="160"
                height="160"
                xmlns="http://www.w3.org/2000/svg">
                <g>
                    <circle
                        class="circle_timer"
                        r="69.85699"
                        cy="81"
                        cx="81"
                        stroke-width="2"
                        fill="none" />
                    <circle
                        class="circle_animation"
                        r="69.85699"
                        cy="81"
                        cx="81"
                        stroke-width="8"
                        fill="none"
                        style="stroke-dashoffset: {strokeOffset}" />
                </g>
            </svg>
        </div>
        <div class="btn-group">
            <span
                on:click={() => {
                    toggleExtra('tasks')
                }}
                class="control">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide lucide-list-todo"
                    ><rect x="3" y="5" width="6" height="6" rx="1" /><path
                        d="m3 17 2 2 4-4" /><path d="M13 6h8" /><path
                        d="M13 12h8" /><path d="M13 18h8" /></svg>
            </span>

            {#if !$timer.running}
                <span on:click={start} class="control">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="lucide lucide-play"
                        ><polygon points="5 3 19 12 5 21 5 3" /></svg>
                </span>
            {:else}
                <span on:click={pause} class="control">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="lucide lucide-pause"
                        ><rect width="4" height="16" x="6" y="4" /><rect
                            width="4"
                            height="16"
                            x="14"
                            y="4" /></svg>
                </span>
            {/if}
            <span on:click={reset} class="control">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide lucide-rotate-ccw"
                    ><path
                        d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path
                        d="M3 3v5h5" /></svg>
            </span>
            <span
                on:click={() => {
                    toggleExtra('settings')
                }}
                class="control">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide lucide-settings-2"
                    ><path d="M20 7h-9" /><path d="M14 17H5" /><circle
                        cx="17"
                        cy="17"
                        r="3" /><circle cx="7" cy="7" r="3" /></svg>
            </span>

            <span on:click={() => toggleExtra('forest')} class="control">
                <svg
                    fill="#DADADA"
                    height="16px"
                    width="16px"
                    version="1.1"
                    id="Capa_1"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlns:xlink="http://www.w3.org/1999/xlink"
                    viewBox="0 0 489.486 489.486"
                    xml:space="preserve"
                    ><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g
                        id="SVGRepo_tracerCarrier"
                        stroke-linecap="round"
                        stroke-linejoin="round"></g
                    ><g id="SVGRepo_iconCarrier">
                        <g>
                            <path
                                d="M471.073,2.673c-98.5-11.5-149.6,16.1-176.2,44.8c-50,53.9-42,155.8-53.2,193.9c-19.3,18-32.6,40.9-42.7,64.8 c-5.6-10.5-12.4-20.2-20.9-28.3c-9.6-96.6-22.9-114.6-36.5-130.3c-18.8-20.8-57.8-40-123-32.3c-7.3,0-13.5,5.2-16.7,11.5 c-3.1,7.3-2.1,14.6,2.1,20.8c11.5,14.6,20.8,31.3,28.1,47.9c2.1,4.2,20.3,56.3,46.9,74c11.5,9.4,24.7,15.9,37.5,18.8 c42.9,9.7,56.3,52.1,62.5,74l-11.5,104.2c-1,11.5,6.3,21.9,17.7,22.9c11.2,1.2,20-7.3,20.8-17.7c9.8-117,33.3-174,65.7-202.2 c12.5-12,35.4-20.8,50-26.1c17.7-7.3,36.9-15.5,54.2-27.1c38-25.6,63.6-101.1,66.7-107.3c11.5-26.1,26.1-51.1,42.7-74 C497.773,14.373,478.773,1.773,471.073,2.673z M74.973,191.273c-2.1-4.2-13.5-28.1-17.7-36.5c58.6-1.2,66.7,42.7,70.9,56.3 c2.1,8.3,4.2,25,6.3,40.6C132.273,251.673,93.973,246.673,74.973,191.273z M398.073,110.973c-28.8,55.5-22.5,72.9-111.5,102.1 c6.8-83.3,26.1-125.1,39.6-140.7c13.5-14.5,49.7-36.2,107.3-32.2C424.173,56.873,401.173,104.773,398.073,110.973z"
                            ></path>
                        </g>
                    </g></svg>
            </span>
        </div>
    </div>

    <div class="pomodoro-extra">
        {#if extra == 'tasks'}
            <TasksComponent {tasks} {tracker} {render} />
        {:else if extra == 'settings'}
            <TimerSettingsComponent />
        {:else if extra == 'forest'}
            <ForestComponent />
        {/if}
    </div>
</div>

<style>
.container {
    width: 100%;
    min-width: 200px;
    display: flex;
    flex-direction: column;
    height: 100%;
}
.main {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 2;
}
.timer {
    position: relative;
    width: 160px;
    height: 160px;
}

.timer svg {
    -webkit-transform: rotate(-90deg);
    transform: rotate(-90deg);
    z-index: 3;
}

.timer-display {
    position: absolute;
    width: 100%;
    height: 160px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    z-index: 4;
    padding: 30px;
}

.timer-text {
    display: block;
    color: var(--pomodoro-timer-text-color);
    font-size: 1.1em;
    font-weight: bold;
    margin-block-start: 1rem;
    margin-block-end: 1.75rem;
}

.status {
    font-size: 0.7rem;
    display: flex;
    align-items: center;
}
.status span {
    display: inline-block;
}
.circle_timer {
    stroke: var(--pomodoro-timer-color);
}

.circle_animation {
    stroke-dasharray: 440; /* this value is the pixel circumference of the circle */
    stroke-dashoffset: 440;
    stroke: var(--pomodoro-timer-elapsed-color);
    /* transition: all 0.2s linear; */
}

.btn-group {
    margin-top: 1rem;
    display: flex;
    justify-content: space-between;
    width: 160px;
}

.control {
    cursor: pointer;
}

.control:hover {
    opacity: 0.7;
}

.control svg:active {
    opacity: 0.5;
}

.pomodoro-extra {
    width: 100%;
    margin-top: 2rem;
}

.breath {
    width: 5px;
    height: 5px;
    margin-top: 5px;
    display: inline-block;
    position: absolute;
    left: 55px;
    background-color: var(--pomodoro-timer-dot-color);
    border-radius: 5px;
    transform: translate(-50%, -50%);
    animation: blink 1s linear infinite;
}

@keyframes blink {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0;
    }
}
</style>
