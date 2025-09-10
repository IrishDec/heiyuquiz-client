// Tiny sample question bank. We’ll replace with GPT later.
const BANK = {
  General: [
    { q: 'What color are emeralds?', options: ['Blue', 'Green', 'Red', 'Yellow'], a: 1 },
    { q: 'How many days are in a leap year?', options: ['365', '366', '367', '364'], a: 1 },
    { q: 'Which planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], a: 1 },
  ],
  Movies: [
    { q: 'Who directed "Jurassic Park"?', options: ['James Cameron','Steven Spielberg','Ridley Scott','Peter Jackson'], a: 1 },
    { q: 'Which film features the DeLorean?', options: ['Blade Runner','Back to the Future','Ghostbusters','Terminator'], a: 1 },
    { q: 'What is the highest-grossing film series?', options: ['James Bond','MCU','Star Wars','Harry Potter'], a: 1 },
  ],
  Science: [
    { q: 'What is H₂O?', options: ['Oxygen','Hydrogen','Water','Carbon Dioxide'], a: 2 },
    { q: 'Speed of light is about…', options: ['300 km/s','3,000 km/s','30,000 km/s','300,000 km/s'], a: 3 },
    { q: 'The powerhouse of the cell?', options: ['Nucleus','Ribosome','Mitochondrion','Chloroplast'], a: 2 },
  ],
  Sports: [
    { q: 'How many players start in a football (soccer) team?', options: ['9','10','11','12'], a: 2 },
    { q: 'How long is a marathon?', options: ['26.2 miles','13.1 miles','10 km','100 km'], a: 0 },
    { q: 'Which sport uses a shuttlecock?', options: ['Tennis','Badminton','Squash','Table Tennis'], a: 1 },
  ],
  History: [
    { q: 'The Roman numeral X equals…', options: ['5','10','50','100'], a: 1 },
    { q: 'Who was known as the Maid of Orléans?', options: ['Cleopatra','Boudica','Joan of Arc','Marie Curie'], a: 2 },
    { q: 'The Great Wall is in…', options: ['Japan','China','India','Korea'], a: 1 },
  ],
};

function makeFallbackMath(n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = 2 + Math.floor(Math.random() * 9);
    const b = 2 + Math.floor(Math.random() * 9);
    const ans = a + b;
    const options = [ans, ans + 1, ans - 1, ans + 2].sort(() => Math.random() - 0.5);
    out.push({ q: `What is ${a} + ${b}?`, options, a: options.indexOf(ans) });
  }
  return out;
}

/**
 * Build questions from a category/topic, with safe fallbacks.
 * Returns {pub: [{q,options}...], answers: [int,...]}
 */
export function buildQuestions(category = 'General', amount = 5, topic = '') {
  amount = Math.max(3, Math.min(10, amount | 0));
  let bank = BANK[category] || BANK.General;
  // Duplicate + shuffle so we can take more than available
  const pool = [...bank, ...bank, ...bank].sort(() => Math.random() - 0.5);
  let picked = pool.slice(0, amount);

  if (picked.length < amount) {
    picked = picked.concat(makeFallbackMath(amount - picked.length));
  }

  // (Optional) tiny biasing: if topic word appears, bubble those up
  if (topic) {
    const t = topic.toLowerCase();
    picked.sort((a, b) => {
      const ha = (a.q + ' ' + a.options.join(' ')).toLowerCase().includes(t) ? 1 : 0;
      const hb = (b.q + ' ' + b.options.join(' ')).toLowerCase().includes(t) ? 1 : 0;
      return hb - ha;
    });
  }

  const pub = picked.map(({ q, options }) => ({ q, options }));
  const answers = picked.map(x => x.a | 0);
  return { pub, answers };
}
