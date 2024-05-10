async function fetchLeaderboard() {
    try {
        const response = await fetch(`/games/${gamename}/leaderboard`);
        const leaderboardData = await response.json();
        const leaderboardTable = document.getElementById('leaderboardTable');
        leaderboardTable.innerHTML = '<tr><th>Rank</th><th>Name</th><th>Score</th></tr>';
        leaderboardData.forEach((entry, index) => {
            const row = `<tr><td>${index + 1}</td><td>${entry.name}</td><td>${entry.score}</td></tr>`;
            leaderboardTable.innerHTML += row;
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
    }
}

fetchLeaderboard();