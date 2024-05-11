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

const games_db = {
    snake: new Sequelize({
        dialect: 'sqlite',
        storage: 'gamesdb/snake.sqlite'
    }),
    flappybird: new Sequelize({
        dialect: 'sqlite',
        storage: 'gamesdb/flappybird.sqlite'
    }),
    snake2: new Sequelize({
        dialect: 'sqlite',
        storage: 'gamesdb/snake2.sqlite'
    }),
    dino: new Sequelize({
        dialect: 'sqlite',
        storage: 'gamesdb/dino.sqlite'
    }),
    pacman: new Sequelize({
        dialect: 'sqlite',
        storage: 'gamesdb/pacman.sqlite'
    }),
    pong: new Sequelize({
        dialect: 'sqlite',
        storage: 'gamesdb/pong.sqlite'
    }),
    snake3: new Sequelize({
        dialect: 'sqlite',
        storage: 'gamesdb/snake3.sqlite'
    }),
};

/*const sequelize = new Sequelize('mysql://username:your_password@localhost:3306/database_name', {
    dialect: 'mysql',
    logging: false
});*/


let LeaderboardEntry = {
    
}

app.use(bodyParser.json());

app.use('/game/:gamename', (req, res, next) => {
    res.render(path.join(__dirname, 'views', 'game.html'), {gamename: req.params.gamename});
});

app.get('/', (req, res) => {
    res.render(path.join(__dirname, 'views', 'index.html'), {});
})

app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.use('/games', express.static(path.join(__dirname, 'games')));

for (let i = 0; i < Object.keys(games_db).length; i++) {
    const key = Object.keys(games_db)[i];

    games_db[key].sync()
        .then(() => {
            console.log('Database and tables synchronized');
        })
        .catch((error) => {
            console.error('Error synchronizing database:', error);
        });
    
    LeaderboardEntry[key] = games_db[key].define('LeaderboardEntry', {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        score: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    });
}

app.get('/games/:gamename/leaderboard', async (req, res) => {
    try {
        const leaderboard = await LeaderboardEntry[req.params.gamename].findAll({
            order: [['score', 'DESC']],
            limit: 20,
            attributes: ['name', 'score']
        });
        res.json(leaderboard);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

app.post('/games/:gamename/leaderboard', async (req, res) => {
    const { name, score } = req.body;
    try {
        let playerEntry = await LeaderboardEntry[req.params.gamename].findOne({ where: { name } });

        if (playerEntry) {
            if (score > playerEntry.score) {
                playerEntry.score = score;
                await playerEntry.save();
                res.status(200).json(playerEntry);
            } else {
                res.status(200).json(playerEntry);
            }
        } else {
            const newEntry = await LeaderboardEntry[req.params.gamename].create({ name, score });
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
