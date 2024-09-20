import { writable, get } from 'svelte/store'
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

// Keep the existing settings store
export const settings = PomodoroSettings.settings

// Points store with initial value (you can change this later to load saved data)
export const points = writable(100)
// Increment points
export function addPoints(value: number) {
	points.update((n) => n + value)
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
	if (pluginInstance === null) {
		console.warn('pluginInstance is null, cannot save progress')
	}
	if (pluginInstance !== null) {
		const data = {
			forest: get(forest),
			points: get(points),
		}
		console.log('Attempting to save data:', data)
		try {
			await pluginInstance.saveData(data)
			console.log('Data saved successfully')
		} catch (error) {
			console.error('Error saving data:', error)
		}
	} else {
		console.warn('Plugin instance is null, cannot save data')
	}
}

// Load saved progress
export async function loadProgress() {
	if (pluginInstance !== null) {
		console.log('Loading saved data')
		try {
			const savedData = await pluginInstance.loadData()
			console.log('Loaded data:', savedData)
			if (savedData) {
				forest.set(savedData.forest || [])
				points.set(savedData.points || 1000)
			}
		} catch (error) {
			console.error('Error loading data:', error)
		}
	} else {
		console.warn('Plugin instance is null, cannot load data')
	}
}

// Function to purchase a plant
export function purchasePlant(plant: Plant) {
	points.update((currentPoints) => {
		if (currentPoints >= plant.cost) {
			forest.update((currentForest) => {
				const updatedForest = [...currentForest, plant]
				console.log('Plant added:', plant) // Log the plant being added
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

			return currentPoints - plant.cost
		} else {
			console.log('Not enough points to buy the plant')
			return currentPoints
		}
	})
}

export function removePlant(plant: Plant) {
	forest.update((currentForest) => {
		return currentForest.filter((p) => p.name !== plant.name) // Remove the selected plant
	})
}
export function upgradePlant(plant: Plant) {
	points.update((currentPoints) => {
		// If upgradeCost doesn't exist yet, initialize it to 3x the plant's base cost
		const currentUpgradeCost = plant.upgradeCost || plant.cost * 3

		if (currentPoints >= currentUpgradeCost) {
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
			return currentPoints - currentUpgradeCost // Deduct points for the upgrade
		} else {
			console.log('Not enough points to upgrade the plant')
			return currentPoints
		}
	})
}
