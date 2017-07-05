const fs = require('fs')
const JSON = require('JSON')

/// FUNCTIONS ///

// Check to see if

// Bounds value between 0.0 and 1.0
function bound(val) {
  if (val > 1.0) {
    return 1.0
  } else if (val < 0.0) {
    return 0.0
  } else {
    return val
  }
}

// Checks the wolf object to see if it is in a pack
function isInPack(wolf) {
  if (wolf.pack >= 0.7) {
    return true
  }
  return false
}

// generation is the JSON object which contains each wolf
// wolves is a list of wolf objects
function getPackSize(generation, numWolves) {
  let packSize = 0

  for (let wolf = 0; wolf < numWolves; wolf++) {
    if (isInPack(generation[wolf])) {
      packSize += 1
    }
  }

  return packSize
}

// Calculates the amount of food divided among the pack with
// decreasing returns
function divideFoodPack(generation, numWolves) {
  // Calculate size of pack
  let packSize = getPackSize(generation)
  // Calculate how much food each wolf in a pack gets (from 0.3 to 2.0)
  let foodPack = -1.0 / (packSize + 0.6) + 2.0

  // If there are too many wolves in the pack,
  // there is not enough food in the forest
  if (packSize / numWolves > 0.6) {
    foodPack -= (-1.0 / (packSize + 0.6) + 2.0) / 3.0
  }

  return foodPack
}

// Calculates the amount of food a lone wolf can hunt on its own
function divideFoodIndividual(wolf) {
  // Multiply the aggression by a constant
  let foodIndividual = wolf.aggression * 1.3

  // Account for time spent running from roaming human tribes
  if (wolf.fear > 0.4) {
    foodIndividual -= 0.5 * wolf.fear
  }

  return foodIndividual
}

// Calculates the amount of food a wolf will recieve from humans
function divideFoodHumans(wolf) {
  let foodHuman = 0


  // If the wolf has low enough fear to approact humans, it will be fed by those humans
  if (wolf.fear <= 0.3) {
    foodHuman += 1.0 * wolf.playfullness - 0.4 * wolf.aggression

    // If the wolf has high enough brain plasticity, it will hunt with the humans
    if (wolf.plasticity >= 0.7) {
      foodHuman += 1.5 * wolf.plasticity + 0.5 * wolf.aggression
    }

    // If the wolf has an extremely low fear of humans (effectively domesticated), it will
    // be able to eat grains, providing a huge boost in the amount of food it can get, based
    // on playfullness
    if (wolf.fear <= 0.15) {
      foodHuman += 3.0 * wolf.playfullness - 0.85 * wolf.aggression + 1.0
    }
  }

  return foodHuman
}

// Sums up the wolf's food from all sources
function calculateFoodTotal(wolf, generation, numWolves) {
  let foodTotal = 0
  if (isInPack(wolf)) {
    foodTotal += divideFoodPack(generation, numWolves)
  }
  foodTotal += divideFoodIndividual(wolf) + divideFoodHumans(wolf)
  return foodTotal
}

// Generate the first generation of wolves
function generateFirst(numWolves) {
  let generation = {}

  for (let i = 0; i < numWolves; i++) {
    let pack = 0.25 * Math.random() + 0.45
    let aggression = 0.1 * Math.random() + 0.6
    let fear = 0.20 * Math.random() + 0.75

    let plasticity = 0.1 * Math.random() + 0.05
    let playfullness = 0.15 * Math.random() + 0.05

    generation[i] = {
      "pack": pack,
      "aggression": aggression,
      "fear": fear,
      "plasticity": plasticity,
      "playfullness": playfullness
    }
  }

  writeGeneration(generation, 0)
  return generation
}

// Write a generation to its file
function writeGeneration(generation, generationNum) {
  fs.writeFile("./generations/generation_" + generationNum + ".json", JSON.stringify(generation, null, ' '), function(err) {
    if (err) {
      console.log(err)
    }
  })
}

function containsDomesticated(generation, generationNum) {
  for (let wolf in generation) {
    if (generation[wolf].fear < 0.03 && generation[wolf].aggression < 0.35) {
      console.log('Domesticated dog found in generation ' + generationNum + '!')
      console.log('wolf ' + wolf + ': ');
      console.log(JSON.stringify(generation[wolf], null, ' '))
      console.log()

      let foodTotal = 0
      if (isInPack(generation[wolf])) {
        foodTotal += divideFoodPack(generation, numWolves)
      }
      foodTotal += divideFoodIndividual(generation[wolf])
      foodTotal += divideFoodHumans(generation[wolf])

      console.log('gathered ' + foodTotal + ' food');
      return true
    }
  }
  return false
}

/// EXECUTED ///

// Number of wolves
let numWolves = 20
let bestNum = numWolves / 4 + 1

//  Generation number
let generationNum = 0
let generation = generateFirst(numWolves)

// Is a wolf completely domesticated
let metRequirement = false

// Main loop
while (!metRequirement) {
  // If there is a domesticated dog, do not finsh this generation
  metRequirement = containsDomesticated(generation, generationNum)
  if (metRequirement) {
    break;
  }

  // Calculate food values for a the current generation
  for (let wolf = 0; wolf < Object.keys(generation).length; wolf++) {
    let foodTotal = 0
    if (isInPack(generation[wolf])) {
      foodTotal += divideFoodPack(generation, numWolves)
    }
    foodTotal += divideFoodIndividual(generation[wolf])
    foodTotal += divideFoodHumans(generation[wolf])
    generation[wolf].food = foodTotal
  }

  // Calculate the best wolves of the generation
  let bestWolves = {}
  for (let wolf = 0; wolf < bestNum; wolf++) {
    bestWolves[wolf] = generation[wolf]
  }

  for (let wolf = bestNum; wolf < numWolves; wolf++) {
    // Find the lowest food value in bestWolves
    let lowest = bestWolves[0]
    for (let key in bestWolves) {
      if (bestWolves[key] < lowest) {
        lowest = bestWolves[key].food
      }
    }

    // Replace the lowest food value in bestWolves
    if (generation[wolf].food > lowest) {
      // Find the key of the lowest value
      for (let key in bestWolves) {
        if (bestWolves[key].food == lowest) {
          delete bestWolves[key]
          bestWolves[wolf] = generation[wolf]
        }
      }
    }
  }

  // Evolution
  let topPerformer = 0
  for (let wolf = 1; wolf < bestNum; wolf++) {
    if (bestWolves[wolf].food > bestWolves[topPerformer].food) {
      topPerformer = wolf
    }
  }
  let topWolf = bestWolves[topPerformer]
  delete bestWolves[topPerformer]

  // Crossover
  let newGeneration = {}
  let currentWolf = 0
  for (let i = 0; i < 2; i++) {
    for (let wolf in bestWolves) {
      newGeneration[currentWolf] = {
        "pack": topWolf.pack,
        "aggression": bestWolves[wolf].aggression,
        "fear": topWolf.fear,
        "plasticity": topWolf.plasticity,
        "playfullness": bestWolves[wolf].playfullness,
      }
      currentWolf += 1

      newGeneration[currentWolf] = {
        "pack": bestWolves[wolf].pack,
        "aggression": topWolf.aggression,
        "fear": bestWolves[wolf].fear,
        "plasticity": bestWolves[wolf].plasticity,
        "playfullness": topWolf.playfullness,
      }
      currentWolf += 1
    }
  }

  // Mutation
  for (let wolf in newGeneration) {
    // Account for selective breeding by humans
    if (newGeneration[wolf].fear <= 0.3) {
      newGeneration[wolf].plasticity = bound(newGeneration[wolf].plasticity + 0.02)
    }
    if (newGeneration[wolf].plasticity >= 0.35) {
      newGeneration[wolf].playfullness = bound(newGeneration[wolf].playfullness + 0.02)
      newGeneration[wolf].aggression = bound(newGeneration[wolf].aggression - 0.01)
    }

    let toBeMutatedIndex = Math.trunc(50 * Math.random())
    let toBeMutatedName
    switch (toBeMutatedIndex) {
      case 0:
        toBeMutatedName = 'pack'
        break;
      case 1:
        toBeMutatedName = 'aggression'
        break;
      case 2:
        toBeMutatedName = 'fear'
        break;
      case 3:
        toBeMutatedName = 'plasticity'
        break;
      case 4:
        toBeMutatedName = 'playfullness'
        break;
      default:
        toBeMutatedName = 'fear'
        break;
    }

    let newValue = bound(newGeneration[wolf][toBeMutatedName] + 0.15 * Math.random() - 0.1)
    newGeneration[wolf][toBeMutatedName] = newValue
  }

  generationNum += 1

  writeGeneration(newGeneration, generationNum)
  generation = newGeneration
}
