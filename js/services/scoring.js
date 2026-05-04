export function computeScores(omdbData) {
  // omdbData: { imdbRating, imdbVotes, Metascore, Ratings[] }
  const imdbRaw = parseFloat(omdbData?.imdbRating);
  const metaRaw = parseInt(omdbData?.Metascore);
  const rtRating = omdbData?.Ratings?.find(r => r.Source === 'Rotten Tomatoes');
  const rtRaw = rtRating ? parseInt(rtRating.Value) : NaN;
  const votes = parseInt((omdbData?.imdbVotes || '0').replace(/,/g, ''));

  const audienceScore = !isNaN(imdbRaw) ? Math.round(imdbRaw * 10) : null;

  const criticParts = [];
  if (!isNaN(metaRaw)) criticParts.push(metaRaw);
  if (!isNaN(rtRaw)) criticParts.push(rtRaw);
  const criticScore = criticParts.length > 0
    ? Math.round(criticParts.reduce((a, b) => a + b, 0) / criticParts.length)
    : null;

  const controversyScore = (audienceScore !== null && criticScore !== null)
    ? Math.abs(audienceScore - criticScore)
    : null;

  let label = 'Balanced';
  if (controversyScore !== null && controversyScore > 25) {
    label = audienceScore > criticScore ? 'Overrated' : 'Underrated';
  }

  const lowConfidence = votes < 500;

  return { audienceScore, criticScore, controversyScore, label, lowConfidence, votes };
}

// Scores from TMDb data only (for Insights page — no OMDb call)
export function computeScoresFromTmdb(movie) {
  const audienceScore = movie.vote_average ? Math.round(movie.vote_average * 10) : null;
  const criticScore = null;
  const controversyScore = null;
  const lowConfidence = movie.vote_count < 500;
  return { audienceScore, criticScore, controversyScore, label: 'Balanced', lowConfidence };
}

export function badgeClass(label) {
  if (label === 'Overrated') return 'badge-overrated';
  if (label === 'Underrated') return 'badge-underrated';
  return 'badge-balanced';
}
