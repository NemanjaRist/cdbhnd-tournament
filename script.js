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
    } else {
        score2 += 10;
    }

    if(score1 == score2){
        console.log("Desio se x");
        if (randomFactor < probability) {
            score1 += 5;
            return { winner: team1, loser: team2, score: [score1, score2] };
        } else {
            score2 += 5;
            return { winner: team2, loser: team1, score: [score2, score1] };
        }
    }
    else if(score1 > score2){
        return { winner: team1, loser: team2, score: [score1, score2] };
    }
    else if(score1 < score2){
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

// Funkcija za rangiranje timova na temelju bodova, koš razlike i postignutih koševa
function rankTeams(teams) {
    return teams.sort((a, b) => {
        return b.points - a.points || b.pointDifference - a.pointDifference || b.scored - a.scored;
    });
}

// Računanje i prikaz konačnih rang lista
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

        // Sortiraj timove u grupi
        teamStats.sort((a, b) => {
            return b.points - a.points || b.pointDifference - a.pointDifference || b.scored - a.scored;
        });

        standings[groupName] = teamStats;
    }

    return standings;
}

// Funkcija za globalno rangiranje timova na krajevima svake pozicije
function globalRankTeams(groupStandings) {
    const firstPlace = [];
    const secondPlace = [];
    const thirdPlace = [];

    for (const groupName in groupStandings) {
        const group = groupStandings[groupName];
        firstPlace.push(group[0]);
        secondPlace.push(group[1]);
        thirdPlace.push(group[2]);
    }

    const rankedFirst = rankTeams(firstPlace);
    const rankedSecond = rankTeams(secondPlace);
    const rankedThird = rankTeams(thirdPlace);

    // Kombinuj rangirane timove
    return [...rankedFirst, ...rankedSecond, ...rankedThird];
}

// Prikazivanje globalnog rangiranja i odluka o prolazu u eliminacionu fazu
function displayGlobalStandings(globalStandings) {
    console.log("\nGlobalno rangirani timovi i odabir za eliminacionu fazu:");
    globalStandings.forEach((team, index) => {
        console.log(`Rang ${index + 1}: ${team.Team} (${team.wins}/${team.losses}/${team.points}/${team.scored}/${team.conceded}/${team.pointDifference})`);
    });

    console.log("\nTimovi koji prolaze u eliminacionu fazu:");
    for (let i = 0; i < 8; i++) {
        console.log(`  ${globalStandings[i].Team}`);
    }
}

// Nakon grupne faze, rangiraj i odluči koji timovi

const shuffleArray = array => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

// Generisanje šešira na osnovu rangova, uzimajući prvih 8 timova
function createPotsFromGlobalStandings(globalStandings) {
    const pots = { D: [], E: [], F: [], G: [] };

    // Pretpostavljamo da je globalStandings već sortiran
    for (let i = 0; i < globalStandings.length; i++) {
        if (i < 2) pots.D.push(globalStandings[i]);
        else if (i < 4) pots.E.push(globalStandings[i]);
        else if (i < 6) pots.F.push(globalStandings[i]);
        else if (i < 8) pots.G.push(globalStandings[i]);
    }

    // Random shuffle pots to simulate the draw
    pots.D = shuffleArray(pots.D);
    pots.E = shuffleArray(pots.E);
    pots.F = shuffleArray(pots.F);
    pots.G = shuffleArray(pots.G);

    return pots;
}

// Generisanje parova četvrtfinala uz pomoć šešira
function generateQuarterFinalMatches(pots) {
    const quarterFinals = [
        [pots.D[0], pots.G[0]],
        [pots.D[1], pots.G[1]],
        [pots.E[0], pots.F[0]],
        [pots.E[1], pots.F[1]]
    ];

    return quarterFinals;
}

// Generisanje parova polufinala nasumičnim ukrštanjem
function generateSemiFinalMatches(quarterFinals) {
    const semiFinals = [
        [quarterFinals[0], quarterFinals[2]],
        [quarterFinals[1], quarterFinals[3]]
    ];

    return semiFinals;
}

// Prikazivanje šešira i parova
function displayDraw(pots, quarterFinals, semiFinals) {
    console.log("Šeširi:");
    for (const pot in pots) {
        console.log(`  Šešir ${pot}`);
        pots[pot].forEach(team => {
            console.log(`    ${team.Team}`);
        });
    }

    console.log("\nParovi četvrtfinala:");
    quarterFinals.forEach((match, index) => {
        console.log(`  Par ${index + 1}: ${match[0].Team} vs ${match[1].Team}`);
    });

    console.log("\nParovi polufinala:");
    semiFinals.forEach((match, index) => {
        console.log(`  Polufinale ${index + 1}: Par ${quarterFinals.indexOf(match[0]) + 1} vs Par ${quarterFinals.indexOf(match[1]) + 1}`);
    });
}

// Prikaz svih funkcionalnosti
// const groupStandings = calculateGroupStandings(groups, groupResults);
const globalStandings = globalRankTeams(groupStandings);
displayGlobalStandings(globalStandings);

const pots = createPotsFromGlobalStandings(globalStandings.slice(0, 8)); // Uzimamo samo prvih 8 timova
const quarterFinals = generateQuarterFinalMatches(pots);
const semiFinals = generateSemiFinalMatches(quarterFinals);
displayDraw(pots, quarterFinals, semiFinals);

// Generisanje i simulacija mečeva za svaku fazu eliminacija
function playEliminationStage(quarterFinals) {
    console.log("\nČetvrtfinale:");
    const semiFinalists = [];
    quarterFinals.forEach(match => {
        const result = simulateMatch(match[0], match[1]);
        console.log(`  ${result.winner.Team} - ${result.loser.Team} (${result.score[0]}:${result.score[1]}) ${result.winner.Team}`);
        semiFinalists.push(result.winner);
    });

    console.log("\nPolufinale:");
    const finalists = [];
    const thirdPlaceCandidates = [];
    for (let i = 0; i < semiFinalists.length; i += 2) {
        const result = simulateMatch(semiFinalists[i], semiFinalists[i + 1]);
        console.log(`  ${result.winner.Team} - ${result.loser.Team} (${result.score[0]}:${result.score[1]})`);
        finalists.push(result.winner);
        thirdPlaceCandidates.push(result.loser);
    }

    console.log("\nUtakmica za treće mesto:");
    const thirdPlaceResult = simulateMatch(thirdPlaceCandidates[0], thirdPlaceCandidates[1]);
    console.log(`  ${thirdPlaceResult.winner.Team} - ${thirdPlaceResult.loser.Team} (${thirdPlaceResult.score[0]}:${thirdPlaceResult.score[1]})`);

    console.log("\nFinale:");
    const finalResult = simulateMatch(finalists[0], finalists[1]);
    console.log(`  ${finalResult.winner.Team} - ${finalResult.loser.Team} (${finalResult.score[0]}:${finalResult.score[1]})`);

    console.log("\nMedalje:");
    console.log(`  1. ${finalResult.winner.Team}`);
    console.log(`  2. ${finalResult.loser.Team}`);
    console.log(`  3. ${thirdPlaceResult.winner.Team}`);
}

// Simulacija i prikaz eliminacione faze
playEliminationStage(quarterFinals);