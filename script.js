const fs = require('fs');

// Funkcija za čitanje JSON podataka
function readJsonFile(filename) {
    const data = fs.readFileSync(filename);
    return JSON.parse(data);
}

// Učitavanje podataka
const groups = readJsonFile('groups.json');
const exhibitions = readJsonFile('exibitions.json');

// Funkcija za proveru trenutne forme na osnovu izložbenih mečeva
function calculateForm(isoCode) {
    const matches = exhibitions[isoCode] || [];
    return matches.reduce((form, match) => {
        const [scoreFor, scoreAgainst] = match.Result.split('-').map(Number);
        return form + (scoreFor - scoreAgainst);
    }, 0) / (matches.length || 1);
}

// Funkcija za simulaciju utakmica između dva tima
function simulateMatch(team1, team2) {
    const rankDifference = team2.FIBARanking - team1.FIBARanking;
    const formTeam1 = calculateForm(team1.ISOCode);
    const formTeam2 = calculateForm(team2.ISOCode);
    const formImpact = formTeam1 - formTeam2;
    const probability = 0.5 + (rankDifference + formImpact) / 100;

    const randomFactor = Math.random();
    let score1 = Math.floor(Math.random() * 30) + 70;
    let score2 = Math.floor(Math.random() * 30) + 70;

    if (randomFactor < probability) {
        score1 += 10;
        return { winner: team1, loser: team2, score: [score1, score2] };
    } else {
        score2 += 10;
        return { winner: team2, loser: team1, score: [score2, score1] };
    }
}

// Funkcija za sortiranje parova utakmica za svaku grupu na osnovu kola
function generateRoundMatches(group) {
    return [
        [[group[0], group[1]], [group[2], group[3]]],
        [[group[0], group[2]], [group[1], group[3]]],
        [[group[0], group[3]], [group[1], group[2]]]
    ];
}

// Funkcija za simulaciju grupne faze
function playGroupStage(groups) {
    const results = {};

    for (const groupName in groups) {
        const group = groups[groupName];
        const roundMatches = generateRoundMatches(group);

        results[groupName] = [];

        roundMatches.forEach((round, roundIndex) => {
            round.forEach(match => {
                const matchResult = simulateMatch(match[0], match[1]);
                results[groupName].push({
                    round: roundIndex + 1,
                    team1: matchResult.winner.Team,
                    team2: matchResult.loser.Team,
                    score: matchResult.score
                });
            });
        });
    }

    return results;
}

// Funkcija za prikaz rezultata po kolima
function displayGroupMatches(groupResults) {
    for (let round = 1; round <= 3; round++) {
        console.log(`\nGrupna faza - kolo ${round}:`);
        for (const groupName in groupResults) {
            console.log(`Grupa ${groupName}:`);
            groupResults[groupName].filter(match => match.round === round).forEach(match => {
                console.log(`  ${match.team1} - ${match.team2} (${match.score[0]}:${match.score[1]})`);
            });
        }
    }
}

// Ispis rezultata
const groupResults = playGroupStage(groups);
displayGroupMatches(groupResults);

// Funkcija za računjanje i prikaz konačnih rang lista po grupama
function calculateGroupStandings(groups, groupResults) {
    const standings = {};

    for (const groupName in groups) {
        const group = groups[groupName];
        const teamStats = group.map(team => ({
            ...team,
            played: 0,
            wins: 0,
            losses: 0,
            points: 0,
            scored: 0,
            conceded: 0,
            pointDifference: 0
        }));

        groupResults[groupName].forEach(match => {
            const team1 = teamStats.find(t => t.Team === match.team1);
            const team2 = teamStats.find(t => t.Team === match.team2);

            // Ažuriranje broja odigranih mečeva, pobeda, poraza, poena
            team1.played += 1;
            team2.played += 1;
            team1.scored += match.score[0];
            team2.scored += match.score[1];
            team1.conceded += match.score[1];
            team2.conceded += match.score[0];
            team1.pointDifference = team1.scored - team1.conceded;
            team2.pointDifference = team2.scored - team2.conceded;

            if (match.score[0] > match.score[1]) {
                team1.wins += 1;
                team1.points += 2;
                team2.losses += 1;
            } else {
                team2.wins += 1;
                team2.points += 2;
                team1.losses += 1;
            }
        });

        // Sortiranje timova u grupi prema broj poena, razlici i broju postignutih koševa
        teamStats.sort((a, b) => {
            return b.points - a.points || b.pointDifference - a.pointDifference || b.scored - a.scored;
        });

        standings[groupName] = teamStats;
    }

    return standings;
}

// Računanje i prikaz konačnih rang lista
const groupStandings = calculateGroupStandings(groups, groupResults);
console.log("\nKonačne rang liste po grupama:");
for (const groupName in groupStandings) {
    console.log(`\nGrupa ${groupName} (Ime - pobede/porazi/bodovi/postignuti koševi/primljeni koševi/koš razlika):`);
    groupStandings[groupName].forEach((team, index) => {
        console.log(`  ${index + 1}. ${team.Team} - ${team.wins}/${team.losses}/${team.points}/${team.scored}/${team.conceded}/${team.pointDifference}`);
    });
}

console.log("izmenaa");