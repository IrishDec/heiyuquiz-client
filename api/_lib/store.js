// Simple in-memory store that survives within the same serverless instance
function getStore() {
  if (!global._HQ_STORE) {
    global._HQ_STORE = {
      quizzes: new Map(),   // id -> {id, category, region, topic, createdAt, closesAt, questions, answers}
      results: new Map(),   // id -> [ { name, score, total } ]
    };
  }
  return global._HQ_STORE;
}

function cleanup() {
  const s = getStore();
  const now = Date.now();
  for (const [id, q] of s.quizzes.entries()) {
    if (q.closesAt && now > q.closesAt) {
      s.quizzes.delete(id);
      // keep results for a short while if you want; here we remove them too
      // s.results.delete(id);
    }
  }
}

function makeId(existingCheck) {
  // 6-char uppercase
  let id;
  do {
    id = Math.random().toString(36).slice(2, 8).toUpperCase();
  } while (existingCheck && existingCheck(id));
  return id;
}

function sampleQuestions(category, amount = 5) {
  const BANK = {
    General: [
      { q: "Which planet is known as the Red Planet?", options: ["Mars","Venus","Jupiter","Mercury"] },
      { q: "What is the capital of France?", options: ["Paris","Lyon","Marseille","Nice"] },
      { q: "How many continents are there?", options: ["7","5","6","8"] },
      { q: "What gas do plants absorb?", options: ["CO₂","O₂","N₂","H₂"] },
      { q: "Which ocean is the largest?", options: ["Pacific","Atlantic","Indian","Arctic"] },
      { q: "What is H₂O commonly called?", options: ["Water","Salt","Sugar","Alcohol"] },
      { q: "Which country hosts the city of Tokyo?", options: ["Japan","China","South Korea","Thailand"] },
    ],
    Movies: [
      { q: "Who directed 'Inception'?", options: ["Christopher Nolan","Steven Spielberg","James Cameron","Ridley Scott"] },
      { q: "Which series features the One Ring?", options: ["The Lord of the Rings","Harry Potter","Twilight","Star Wars"] },
      { q: "Who played the Joker in 'The Dark Knight'?", options: ["Heath Ledger","Joaquin Phoenix","Jared Leto","Jack Nicholson"] },
      { q: "Which film won Best Picture (2020)?", options: ["Parasite","1917","Joker","Ford v Ferrari"] },
      { q: "What color pill does Neo take?", options: ["Red","Blue","Green","Yellow"] },
    ],
    Science: [
      { q: "Speed of light is about…", options: ["3×10^8 m/s","3×10^6 m/s","3×10^5 m/s","3×10^9 m/s"] },
      { q: "DNA stands for…", options: ["Deoxyribonucleic acid","Dinitro acid","Double nitrogen acid","Dextroribonucleic acid"] },
      { q: "Human body has how many bones (adult)?", options: ["206","201","210","190"] },
      { q: "Earth's core is mainly…", options: ["Iron & Nickel","Silicon","Carbon","Copper"] },
      { q: "pH < 7 indicates…", options: ["Acidic","Basic","Neutral","Radioactive"] },
    ],
    Sports: [
      { q: "A soccer match has…", options: ["90 mins","80 mins","70 mins","100 mins"] },
      { q: "NBA stands for…", options: ["National Basketball Association","Northern Baseball Association","National Boxing Assoc","North Basketball Assoc"] },
      { q: "Tennis Grand Slams per year?", options: ["4","3","5","6"] },
      { q: "Rugby union team players on field per side?", options: ["15","13","11","12"] },
      { q: "Golf hole-in-one is on the…", options: ["Tee shot","Chip","Putt","Penalty drop"] },
    ],
    History: [
      { q: "Pyramids of Giza are in…", options: ["Egypt","Mexico","Peru","Sudan"] },
      { q: "WW2 ended in…", options: ["1945","1944","1939","1950"] },
      { q: "The Roman Empire fell (West) in…", options: ["476 AD","1066 AD","800 AD","313 AD"] },
      { q: "Magna Carta signed in…", options: ["1215","1066","1492","1314"] },
      { q: "First US President?", options: ["George Washington","Abraham Lincoln","Thomas Jefferson","John Adams"] },
    ],
  };
  const bank = BANK[category] || BANK.General;
  const out = [];
  for (let i = 0; i < amount; i++) {
    out.push(bank[i % bank.length]);
  }
  // Make every correct answer index = 0 (first option)
  const answers = out.map(() => 0);
  return { questions: out, answers };
}

async function readJson(req) {
  try {
    if (req.body && typeof req.body === 'object') return req.body;
    let s = '';
    await new Promise((resolve) => {
      req.on('data', c => s += c);
      req.on('end', resolve);
    });
    return s ? JSON.parse(s) : {};
  } catch {
    return {};
  }
}

/* ---------------- Helpers for /answers ---------------- */

/** Return the best-guess correct index for a question object. */
function getCorrectIndexFromQuestion(Q) {
  if (!Q || typeof Q !== 'object') return null;
  if (typeof Q.correctIndex === 'number') return Q.correctIndex;
  if (typeof Q.answerIndex  === 'number') return Q.answerIndex;
  if (typeof Q.correct      === 'number') return Q.correct;

  const opts = Array.isArray(Q.options) ? Q.options
            : (Array.isArray(Q.choices) ? Q.choices : []);
  const answerText =
    Q.answer ?? Q.correctAnswer ?? Q.correct_option ?? Q.correctText ?? null;

  if (answerText != null && Array.isArray(opts)) {
    const idx = opts.findIndex(o => String(o).trim() === String(answerText).trim());
    return idx >= 0 ? idx : null;
  }
  return null;
}

/**
 * Normalize a quiz into { questions:[{q, options}], correct:[Number|null] }
 * Prefers quiz.answers (array of indexes) if present; otherwise derives per-question.
 */
function normalizeForAnswers(quiz) {
  const src = quiz || {};
  const qs = Array.isArray(src.questions) ? src.questions : [];
  const questions = qs.map(Q => ({
    q: Q.q || Q.question || '',
    options: Array.isArray(Q.options) ? Q.options
           : (Array.isArray(Q.choices) ? Q.choices : [])
  }));

  let correct = Array.isArray(src.answers) ? src.answers.slice() : null;
  if (!correct) {
    correct = qs.map(getCorrectIndexFromQuestion);
  }
  return { questions, correct };
}

module.exports = {
  getStore,
  cleanup,
  makeId,
  sampleQuestions,
  readJson,
  // new exports:
  getCorrectIndexFromQuestion,
  normalizeForAnswers,
};

