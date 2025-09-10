export const config = { runtime: 'nodejs18.x' };

const SAMPLE = [
  { q: 'When did The Beatles release "Please Please Me"?', options: ['1960','1963','1970','1969'] },
  { q: 'IaaS stands for…', options: ['Infrastructure as a Server','Infrastructure as a Service','Internet as a Service','Internet and a Server'] },
  { q: 'German for "spoon"?', options: ['Löffel','Messer','Essstäbchen','Gabel'] },
  { q: 'Year the M1911 pistol was designed?', options: ['1917','1907','1899','1911'] },
  { q: 'Vader’s line?', options: ['Luke, I am your father.','No. I am your father.','You’re wrong. I am your father.','The truth is that I am your father.'] },
];

export function getQuestions({ amount = 5 } = {}) {
  return SAMPLE.slice(0, Math.max(1, Math.min(amount, SAMPLE.length)));
}
