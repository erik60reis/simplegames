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


async function submitHighScore() {
    const playerName = document.getElementById('playerName').value;
    const currentScore = localStorage.getItem(gamename + 'HighScore') || 0;
    if (playerName && currentScore > 0) {
        try {
            const response = await fetch(`/games/${gamename}/leaderboard`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: playerName, score: currentScore })
            });
            if (response.ok) {
                alert('High score submitted successfully!');
                fetchLeaderboard(); // Refresh leaderboard after submission
            } else {
                throw new Error('Failed to submit high score');
            }
        } catch (error) {
            console.error('Error submitting high score:', error);
            alert('Failed to submit high score. Please try again.');
        }
    } else {
        alert('Please enter your name and achieve a score greater than 0 to submit.');
    }
}