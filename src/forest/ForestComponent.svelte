<script>
import { onMount } from 'svelte'
import {
    pointsData,
    forest,
    plants,
    purchasePlant,
    upgradePlant,
    removePlant,
} from '../stores'

let gridSize = 4
let selectedPlantId = null
let hoveredPlantId = null

$: availableSlots = gridSize * gridSize - $forest.length
$: selectedPlant = $forest.find((p) => p.id === selectedPlantId)
$: isResetState = $forest.length === 0 && $pointsData.total === 200

function handlePlantClick(plantId) {
    console.log('Clicked plant ID:', plantId)
    console.log(
        'Clicked plant:',
        $forest.find((p) => p.id === plantId),
    )
    selectedPlantId = selectedPlantId === plantId ? null : plantId
    console.log('Plant selected:', selectedPlantId)
}

function handleUpgrade() {
    if (selectedPlantId) {
        upgradePlant(selectedPlantId)
        console.log('Plant upgraded:', selectedPlantId)
    }
}

function handleRemove() {
    if (selectedPlantId) {
        removePlant(selectedPlantId)
        selectedPlantId = null
        console.log('Plant removed:', selectedPlantId)
    }
}

function handlePurchase(plant) {
    if ($pointsData.total >= plant.cost && availableSlots > 0) {
        purchasePlant(plant)
        console.log('Plant purchased:', plant.name)
    }
}

function handleHover(plantId) {
    hoveredPlantId = plantId
}

function handleHoverEnd() {
    hoveredPlantId = null
}

onMount(() => {
    console.log('Forest component mounted')
    console.log('Initial forest:', $forest)
})

$: {
    console.log('Current forest:', $forest)
    console.log('selectedPlantId changed:', selectedPlantId)
    console.log('selectedPlant:', selectedPlant)
}
</script>

<div class="forest-container">
    {#if isResetState}
        <div class="reset-indicator">Forest Reset (Debug Mode)</div>
    {/if}

    <div class="points-display">
        <div class="total-points">Total Points: {$pointsData.total}</div>
        <div class="daily-points">Points Gained Today: {$pointsData.daily}</div>
    </div>

    <div
        class="forest-grid"
        style="grid-template-columns: repeat({gridSize}, 1fr);">
        {#each $forest as plant (plant.id)}
            <button
                class="plant-cell {selectedPlantId === plant.id
                    ? 'selected'
                    : ''} {hoveredPlantId === plant.id ? 'hovered' : ''}"
                on:click={() => handlePlantClick(plant.id)}
                on:mouseenter={() => handleHover(plant.id)}
                on:mouseleave={handleHoverEnd}>
                <div
                    class="plant-icon {plant.name
                        .toLowerCase()
                        .replace(' ', '-')}">
                </div>
                {#if hoveredPlantId === plant.id || selectedPlantId === plant.id}
                    <span class="plant-level">Lvl {plant.level}</span>
                {/if}
            </button>
        {/each}
        {#each Array(availableSlots) as _, i}
            <div class="plant-cell empty"></div>
        {/each}
    </div>

    <div class="action-panel">
        {#if selectedPlant}
            <button
                class="action-button upgrade"
                on:click={handleUpgrade}
                disabled={$pointsData.total <
                    (selectedPlant.upgradeCost || selectedPlant.cost * 3)}>
                <span class="icon">💧</span> Upgrade ({selectedPlant.upgradeCost ||
                    selectedPlant.cost * 3} points)
            </button>
            <button class="action-button remove" on:click={handleRemove}>
                <span class="icon">💀</span> Remove
            </button>
        {:else}
            <h3>Plant Shop</h3>
            {#each plants as plant}
                <button
                    class="shop-item"
                    on:click={() => handlePurchase(plant)}
                    disabled={$pointsData.total < plant.cost ||
                        availableSlots === 0}>
                    <div
                        class="plant-icon {plant.name
                            .toLowerCase()
                            .replace(' ', '-')}">
                    </div>
                    <span>{plant.name} - {plant.cost} points</span>
                </button>
            {/each}
        {/if}
    </div>
</div>

<style>
.forest-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    background-color: #262626;
    color: #dadada;
    font-family: Arial, sans-serif;
}

.reset-indicator {
    background-color: #ff9800;
    color: #000;
    padding: 5px 10px;
    border-radius: 5px;
    margin-bottom: 10px;
    font-weight: bold;
}

.points-display {
    width: 100%;
    max-width: 400px;
    margin-bottom: 20px;
    padding: 10px;
    background-color: #3a3a3a;
    border-radius: 5px;
    display: flex;
    justify-content: space-between;
}

.total-points,
.daily-points {
    font-size: 1.1em;
    color: #6ed86c;
}

.forest-grid {
    display: grid;
    gap: 10px;
    width: 100%;
    max-width: 400px;
    margin-bottom: 20px;
}

.plant-cell {
    aspect-ratio: 1;
    width: 100%;
    background-color: #3a3a3a;
    border: 2px solid #6ed86c;
    border-radius: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    padding: 0;
}

.plant-cell.empty {
    border: 2px dashed #6ed86c;
    cursor: default;
}

.plant-cell:hover,
.plant-cell.selected,
.plant-cell.hovered {
    box-shadow: 0 0 10px rgba(110, 216, 108, 0.5);
}

.plant-icon {
    width: 90%;
    height: 90%;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
}

.plant-level {
    position: absolute;
    bottom: 5px;
    right: 5px;
    background-color: rgba(0, 0, 0, 0.7);
    color: #6ed86c;
    padding: 2px 5px;
    border-radius: 10px;
    font-size: 0.8em;
}

.action-panel {
    width: 100%;
    max-width: 400px;
}

.action-button,
.shop-item {
    width: 100%;
    padding: 10px;
    margin-bottom: 10px;
    background-color: #3a3a3a;
    border: none;
    border-radius: 5px;
    color: #dadada;
    cursor: pointer;
    display: flex;
    align-items: center;
    font-size: 1em;
    transition: background-color 0.3s;
}

.action-button:hover,
.shop-item:hover {
    background-color: #4a4a4a;
}

.action-button:disabled,
.shop-item:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.action-button .icon,
.shop-item .plant-icon {
    margin-right: 10px;
    font-size: 1.2em;
}

.action-button.upgrade {
    background-color: #4caf50;
}

.action-button.remove {
    background-color: #f44336;
}

h3 {
    margin-bottom: 10px;
    color: #6ed86c;
}

.plant-icon.big-tree {
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><g><path fill="%23394240" d="M55.643,46.344L35.641,2.342C34.992,0.92,33.57-0.001,32-0.001c-1.571,0-2.993,0.922-3.642,2.344l-20,44.001c-0.562,1.242-0.457,2.68,0.277,3.82C9.374,51.312,10.64,52,11.999,52h16v8c0,2.211,1.789,4,4.001,4c2.211,0,4-1.789,4-4v-8h16.002c1.359,0,2.625-0.688,3.359-1.836C56.096,49.023,56.205,47.586,55.643,46.344z M18.21,44L32,13.671L45.789,44H18.21z"/><polygon fill="%23B4CCB9" points="18.21,44 32,13.671 45.789,44"/></g></svg>');
}

.plant-icon.flower {
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><g><path fill="%23E45D73" d="M398.231,142.224c0,78.545-63.68,142.218-142.231,142.218c-78.545,0-142.221-63.673-142.221-142.218S177.455,0,256,0C334.551,0,398.231,63.68,398.231,142.224z"/><path fill="%23EC707F" d="M398.231,369.77C398.231,448.321,334.551,512,256,512c-78.545,0-142.221-63.679-142.221-142.23c0-78.539,63.676-142.212,142.221-142.212C334.551,227.558,398.231,291.231,398.231,369.77z"/><path fill="%23E45D73" d="M142.221,113.77c78.548,0,142.221,63.673,142.221,142.224c0,78.545-63.673,142.224-142.221,142.224C63.68,398.219,0,334.539,0,255.994C0,177.443,63.68,113.77,142.221,113.77z"/><path fill="%23EC707F" d="M369.769,113.77C448.32,113.77,512,177.443,512,255.994c0,78.545-63.68,142.224-142.231,142.224c-78.538,0-142.211-63.68-142.211-142.224C227.558,177.443,291.231,113.77,369.769,113.77z"/><path fill="%23F3E39C" d="M329.622,256.007c0,40.654-32.968,73.616-73.622,73.616c-40.66,0-73.622-32.962-73.622-73.616c0-40.66,32.962-73.628,73.622-73.628C296.654,182.378,329.622,215.346,329.622,256.007z"/></g></svg>');
}

.plant-icon.small-tree {
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><g><path fill="%23394240" d="M32,0C18.148,0,12,23.188,12,32c0,9.656,6.883,17.734,16,19.594V60c0,2.211,1.789,4,4,4s4-1.789,4-4v-8.406C45.117,49.734,52,41.656,52,32C52,22.891,46.051,0,32,0z M32,44c-6.617,0-12-5.383-12-12c0-8.812,5.93-24,12-24c6.566,0,12,15.891,12,24C44,38.617,38.617,44,32,44z"/><path fill="%23B4CCB9" d="M32,44c-6.617,0-12-5.383-12-12c0-8.812,5.93-24,12-24c6.566,0,12,15.891,12,24C44,38.617,38.617,44,32,44z"/></g></svg>');
}
</style>
