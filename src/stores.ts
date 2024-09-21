import { writable, get, derived } from 'svelte/store'
import type { Plugin } from 'obsidian'
import PomodoroSettings, { type Settings } from './Settings'

// Types
interface Plant {
	id: string
	name: string
	cost: number
	icon: string
	level: number
	upgradeCost: number
}

interface PointsData {
	total: number
	daily: number
	lastReset: string // ISO date string
}

// Plugin instance
let pluginInstance: Plugin | null = null

// Constants
const PLANT_TYPES: Omit<Plant, 'id' | 'level' | 'upgradeCost'>[] = [
	{ name: 'Small Tree', cost: 30, icon: 'tree' },
	{ name: 'Big Tree', cost: 50, icon: 'tree' },
	{ name: 'Flower', cost: 20, icon: 'flower' },
]

const INITIAL_POINTS_DATA: PointsData = {
	total: 900,
	daily: 0,
	lastReset: new Date().toISOString().split('T')[0],
}

// Stores
export const settings = PomodoroSettings.settings
export const pointsData = writable<PointsData>(INITIAL_POINTS_DATA)
export const points = derived(pointsData, ($pointsData) => $pointsData.total)
export const forest = writable<Plant[]>([])
export const plants = PLANT_TYPES

// State
let nextPlantId = 1

// Helper Functions
function generatePlantId(): string {
	return `plant_${nextPlantId++}`
}

function calculateUpgradeCost(plant: Plant): number {
	return plant.level === 1 ? plant.cost * 3 : plant.upgradeCost * 2
}

export function resetStoresForDebug(): void {
	forest.set([])
	pointsData.set(INITIAL_POINTS_DATA)
	nextPlantId = 1
	console.log('Stores reset for debugging')
	saveProgress()
}

// Main Functions
export function setPlugin(plugin: Plugin): void {
	console.log('Setting plugin instance:', plugin)
	pluginInstance = plugin
}

export function addPoints(value: number): void {
	pointsData.update((data) => {
		const today = new Date().toISOString().split('T')[0]
		if (data.lastReset !== today) {
			data.daily = 0
			data.lastReset = today
		}
		return {
			...data,
			total: data.total + value,
			daily: data.daily + value,
		}
	})
	saveProgress()
}

export function purchasePlant(
	plantType: Omit<Plant, 'id' | 'level' | 'upgradeCost'>,
): void {
	pointsData.update((data) => {
		if (data.total >= plantType.cost) {
			const newPlant: Plant = {
				...plantType,
				id: `plant_${nextPlantId++}`,
				level: 1,
				upgradeCost: plantType.cost * 3,
			}
			forest.update((currentForest) => [...currentForest, newPlant])
			console.log('Plant purchased:', newPlant)
			saveProgress()
			return {
				...data,
				total: data.total - plantType.cost,
			}
		}
		console.log('Not enough points to purchase plant')
		return data
	})
}

export function upgradePlant(plantId: string): void {
	let upgraded = false
	forest.update((currentForest) =>
		currentForest.map((plant) => {
			if (plant.id === plantId) {
				const upgradeCost = calculateUpgradeCost(plant)
				if (get(pointsData).total >= upgradeCost) {
					upgraded = true
					console.log(
						`Plant ${plantId} upgraded from level ${plant.level
						} to ${plant.level + 1}`,
					)
					return {
						...plant,
						level: plant.level + 1,
						upgradeCost: upgradeCost * 2,
					}
				}
			}
			return plant
		}),
	)

	if (upgraded) {
		pointsData.update((data) => ({
			...data,
			total:
				data.total -
				calculateUpgradeCost(
					get(forest).find((p) => p.id === plantId)!,
				),
		}))
		saveProgress()
	} else {
		console.log('Not enough points to upgrade plant or plant not found')
	}
}

export function removePlant(plantId: string): void {
	forest.update((currentForest) => {
		const updatedForest = currentForest.filter(
			(plant) => plant.id !== plantId,
		)
		console.log('Plant removed, updated forest:', updatedForest)
		saveProgress()
		return updatedForest
	})
}

// Data Persistence
async function saveProgress(): Promise<void> {
	if (pluginInstance) {
		try {
			const data = {
				forest: get(forest),
				pointsData: get(pointsData),
				nextPlantId,
			}
			await pluginInstance.saveData(data)
			console.log('Progress saved successfully')
		} catch (error) {
			console.error('Error saving progress:', error)
		}
	} else {
		console.warn('Plugin instance is null, cannot save data')
	}
}

export async function loadProgress(): Promise<void> {
	if (pluginInstance) {
		try {
			const savedData = await pluginInstance.loadData()
			if (savedData) {
				forest.set(savedData.forest || [])
				if (savedData.pointsData) {
					const today = new Date().toISOString().split('T')[0]
					if (savedData.pointsData.lastReset !== today) {
						savedData.pointsData.daily = 0
						savedData.pointsData.lastReset = today
					}
					pointsData.set(savedData.pointsData)
				} else {
					pointsData.set(INITIAL_POINTS_DATA)
				}
				nextPlantId = savedData.nextPlantId || nextPlantId
				console.log('Progress loaded successfully')
			}
		} catch (error) {
			console.error('Error loading progress:', error)
		}
	} else {
		console.warn('Plugin instance is null, cannot load data')
	}
}

// Debug function (remove in production)
export function debugStores(): void {
	console.log('Current forest:', get(forest))
	console.log('Current points:', get(pointsData))
	console.log('Next plant ID:', nextPlantId)
}
