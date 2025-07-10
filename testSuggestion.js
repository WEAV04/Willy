import { getProactiveSuggestion } from './modules/suggestions/index.js';

const testMemories = [
  {
    name: 'Ansiedad reciente',
    memory: {
      lastEmotion: 'ansiedad',
      lastModuleUsed: 'tutor',
      activeGoals: ['mejorar concentración'],
      recentHabits: ['respiración consciente']
    }
  },
  {
    name: 'Tristeza sin metas',
    memory: {
      lastEmotion: 'tristeza',
      lastModuleUsed: 'diario',
      activeGoals: [],
      recentHabits: []
    }
  },
  {
    name: 'Sin emoción actual',
    memory: {
      lastEmotion: null,
      lastModuleUsed: 'reflexion',
      activeGoals: ['autocuidado'],
      recentHabits: ['gratitud']
    }
  }
];

for (const test of testMemories) {
  console.log(`\n🧪 Test: ${test.name}`);
  const suggestion = getProactiveSuggestion(test.memory);
  if (suggestion) {
    console.log(`✅ Sugerencia: ${suggestion.message}`);
  } else {
    console.log('⚠️ No se generó ninguna sugerencia.');
  }
}
