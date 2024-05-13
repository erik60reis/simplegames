const express = require('express');
const bodyParser = require('body-parser');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const fs = require('fs');
const expressHandlebars = require('express-handlebars');

var JavaScriptObfuscator = require('javascript-obfuscator');

let obfuscateJSCode = true;
let codeNotAffectedByObfuscation = ['/assets/babylon.js', '/assets/isaacCSPRNG.min.js'];

const app = express();
const PORT = process.env.PORT || 3000;

const handlebars = expressHandlebars.create({
    defaultLayout: false,
    extname: '.html'
});

app.engine('.html', handlebars.engine);
app.set('view engine', '.html');

if (obfuscateJSCode) {
    app.use((req, res, next) => {
        try {
          if (req.url.endsWith('.js') && !codeNotAffectedByObfuscation.includes(req.path)) {
            const obfuscatedCode = JavaScriptObfuscator.obfuscate(fs.readFileSync(path.join(__dirname, req.path), 'utf-8'), {
                compact: true,
                controlFlowFlattening: true,
                controlFlowFlatteningThreshold: 1,
                numbersToExpressions: true,
                simplify: true,
                stringArrayShuffle: true,
                splitStrings: true,
                stringArrayThreshold: 1
            });
            res.setHeader('Content-Type', 'text/javascript');
            res.send(obfuscatedCode.getObfuscatedCode());
            } else {
                next();
            }
        } catch (error) {
            next();
        }
    });
}

const games_db = new Sequelize({
    dialect: 'sqlite',
    storage: 'database.sqlite'
});

let games = {};

let gamefiles = fs.readdirSync(path.join(__dirname, 'games'));

for (let i = 0; i < gamefiles.length; i++) {
    const gamename = gamefiles[i].replace(new RegExp(".js" + "$"), "");
    games[gamename] = games_db.define(gamename, {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        score: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        replay: {
            type: DataTypes.TEXT,
            allowNull: true,
            unique: false
        },
    });
}

// Sync all defined models with the database
games_db.sync()
    .then(() => {
        console.log('Database and tables synchronized');
    })
    .catch((error) => {
        console.error('Error synchronizing database:', error);
    });

app.use(bodyParser.json());

app.use('/game/:gamename', (req, res, next) => {
    res.render(path.join(__dirname, 'views', 'game.html'), {gamename: req.params.gamename});
});

app.use('/viewreplay/:gamename/:username', (req, res, next) => {
    res.render(path.join(__dirname, 'views', 'viewreplay.html'), {gamename: req.params.gamename, username: req.params.username});
});

app.get('/', (req, res) => {
    res.render(path.join(__dirname, 'views', 'index.html'), {});
})

app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/', express.static(path.join(__dirname, 'public')));

app.use('/games', express.static(path.join(__dirname, 'games')));
app.use('/gamesviewreplay', express.static(path.join(__dirname, 'gamesviewreplay')));

app.get('/games/:gamename/leaderboard', async (req, res) => {
    try {
        const leaderboard = await games[req.params.gamename].findAll({
            order: [['score', 'DESC']],
            limit: 20,
            attributes: ['name', 'score', 'replay']
        });
        res.json(leaderboard);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

app.post('/games/:gamename/leaderboard', async (req, res) => {
    const { name, score, replay } = req.body;
    try {
        let playerEntry = await games[req.params.gamename].findOne({ where: { name } });

        if (playerEntry) {
            if (score > playerEntry.score) {
                playerEntry.score = score;
                playerEntry.replay = JSON.stringify(replay);
                await playerEntry.save();
                res.status(200).json(playerEntry);
            } else {
                res.status(200).json(playerEntry);
            }
        } else {
            const newEntry = await games[req.params.gamename].create({ name, score, replay: JSON.stringify(replay) });
            res.status(201).json(newEntry);
        }
    } catch (error) {
        console.error('Error adding/updating entry in leaderboard:', error);
        res.status(500).json({ error: 'Failed to add/update entry in leaderboard' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});