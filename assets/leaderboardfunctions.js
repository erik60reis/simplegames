async function fetchLeaderboard() {
    try {
        const response = await fetch(`/games/${gamename}/leaderboard`);
        const leaderboardData = await response.json();
        const leaderboardTable = document.getElementById('leaderboardTable');
        leaderboardTable.innerHTML = '<tr class="leaderboardfirstrow"><th class="aligncenter">Rank</th><th class="aligncenter">Name</th><th class="aligncenter">Score</th></tr>';
        leaderboardData.forEach((entry, index) => {
            const row = `<tr class="leaderboardOtherRows"><td>#${index + 1}</td><td class="playerName"></td><td class="playerScore"></td></tr>`;
            leaderboardTable.innerHTML += row;
            document.getElementsByClassName("playerName")[document.getElementsByClassName("playerName").length - 1].textContent = entry.name;
            document.getElementsByClassName("playerScore")[document.getElementsByClassName("playerScore").length - 1].textContent = entry.score;
        });
        return leaderboardData;
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
    }
}

fetchLeaderboard();