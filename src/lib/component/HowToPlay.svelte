<script>
  const steps = [
    { 
      title: "Configure Puzzles", 
      description: "First time playing? Click on settings to load and configure your puzzles.",
      icon: "⚙️"
    },
    { 
      title: "Select Puzzles", 
      description: "Choose the specific puzzles you want to play from the settings menu.",
      icon: "✅"
    },
    { 
      title: "Start Game", 
      description: "Click the start button to begin your puzzle-solving adventure!",
      icon: "🎮"
    },
    { 
      title: "Split Puzzles", 
      description: "If a puzzle doesn't auto-detect a split, use the split button to move to the next puzzle.",
      icon: "➗"
    }
  ];
</script>

  <h2 class="text-3xl font-bold mb-6 text-center text-blue-700 dark:text-blue-300">How to Play</h2>
  
  <div class="space-y-4">
    {#each steps as step}
      <div class="flex items-center bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm hover:shadow-md transition-all">
        <div class="text-4xl mr-4 opacity-70">{step.icon}</div>
        <div>
          <h3 class="font-semibold text-lg text-blue-600 dark:text-blue-300">{step.title}</h3>
          <p class="text-gray-600 dark:text-gray-300">{step.description}</p>
        </div>
      </div>
    {/each}
  </div>

  <div class="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
    <p>Enjoy solving puzzles and have fun!</p>
  </div>
