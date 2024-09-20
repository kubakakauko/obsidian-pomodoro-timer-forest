import { writable, get, derived } from 'svelte/store'
import type { Plugin } from 'obsidian'
import PomodoroSettings, { type Settings } from './Settings'

let pluginInstance: Plugin | null = null

// Define the shape of a plant object
interface Plant {
	name: string
	cost: number
	icon: string
	level?: number
	upgradeCost?: number
}

interface PointsData {
	total: number
	daily: number
	lastReset: string //ISO string
}

// Keep the existing settings store
export const settings = PomodoroSettings.settings

// Points store with initial value (you can change this later to load saved data)
const initialPointsData: PointsData = {
	total: 100,
	daily: 0,
	lastReset: new Date().toISOString().split('T')[0], // Get today's date in ISO format
}

export const pointsData = writable<PointsData>(initialPointsData)

export const points = derived(pointsData, ($pointsData) => $pointsData.total)

export function addPoints(value: number) {
	pointsData.update((data) => {
		const today = new Date().toISOString().split('T')[0]
		if (data.lastReset !== today) {
			// Reset daily points if it's a new day
			data.daily = 0
			data.lastReset = today
		}
		return {
			...data,
			total: data.total + value,
			daily: data.daily + value,
		}
	})
}

// Available plants
export const plants: Plant[] = [
	{ name: 'Small Tree', cost: 30, icon: 'tree' },
	{ name: 'Big Tree', cost: 50, icon: 'tree' },
	{ name: 'Flower', cost: 20, icon: 'flower' },
]

// Store for the user's purchased plants (the forest)
export const forest = writable<Plant[]>([])

// Function to set the plugin instance
export function setPlugin(plugin: Plugin) {
	console.log('Setting plugin instance:', plugin)
	pluginInstance = plugin
}

// Save forest and points data
async function saveProgress() {
	if (pluginInstance) {
		const data = {
			forest: get(forest),
			pointsData: get(pointsData),
		}
		await pluginInstance.saveData(data)
	}
}

// Load saved progress
export async function loadProgress() {
	if (pluginInstance) {
		const savedData = await pluginInstance.loadData()
		if (savedData) {
			forest.set(savedData.forest || [])
			if (savedData.pointsData) {
				const today = new Date().toISOString().split('T')[0]
				if (savedData.pointsData.lastReset !== today) {
					// Reset daily points if it's a new day
					savedData.pointsData.daily = 0
					savedData.pointsData.lastReset = today
				}
				pointsData.set(savedData.pointsData)
			} else {
				pointsData.set(initialPointsData)
			}
		}
	}
}

// Function to purchase a plant
export function purchasePlant(plant: Plant) {
	pointsData.update((data) => {
		if (data.total >= plant.cost) {
			forest.update((currentForest) => {
				const updatedForest = [...currentForest, { ...plant, level: 1 }]
				console.log('Plant added:', plant)
				return updatedForest
			})
			console.log('Attempting to save progress after purchasing a plant')

			// Call saveProgress and log before and after to ensure it is called properly
			saveProgress()
				.then(() => {
					console.log(
						'Progress saved successfully after purchasing a plant',
					)
				})
				.catch((error) => {
					console.error('Error saving progress:', error)
				})

			return {
				...data,
				total: data.total - plant.cost,
			}
		} else {
			console.log('Not enough points to buy the plant')
			return data
		}
	})
}

export function removePlant(plant: Plant) {
	forest.update((currentForest) => {
		return currentForest.filter((p) => p.name !== plant.name) // Remove the selected plant
	})
}
export function upgradePlant(plant: Plant) {
	pointsData.update((data) => {
		// If upgradeCost doesn't exist yet, initialize it to 3x the plant's base cost
		const currentUpgradeCost = plant.upgradeCost || plant.cost * 3

		if (data.total >= currentUpgradeCost) {
			forest.update((currentForest) => {
				const updatedForest = currentForest.map((p) => {
					if (p.name === plant.name) {
						// Upgrade logic: set level if it's undefined, then increment it
						if (!p.level) {
							p.level = 1 // Initialize level if it's not already set
						}

						p.level += 1 // Increment plant level

						// Update upgrade cost: 2x the current upgrade cost for the next level
						p.upgradeCost = currentUpgradeCost * 2

						console.log(
							`${plant.name} upgraded to level ${p.level}. Next upgrade cost: ${p.upgradeCost}`,
						)
					}
					return p
				})
				return updatedForest
			})
			return {
				...data,
				total: data.total - currentUpgradeCost,
			}
		} else {
			console.log('Not enough points to upgrade the plant')
			return data
		}
	})
}
