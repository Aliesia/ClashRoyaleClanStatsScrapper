const OPTIONS = {
    site: 'https://royaleapi.com/clan/89VLQR0',
    collectPlayerData: false,
};
const webdriver = require('selenium-webdriver');
const {By, until} = require('selenium-webdriver');

let driver = new webdriver.Builder()
    .forBrowser('chrome')
    .build();

let clanData = {
    totalDonations: 0,
    totalRequests: 0,
    totalTrophies: 0,
    avgTrophies: 0,
    membersList: []
};

driver.get(OPTIONS.site)
    .then(() => driver.wait(until.elementLocated(By.css('#roster tbody tr'))))
    .then(() => driver.findElements(By.css('#roster tbody tr')))
    .then(async rows => {
        for (let i = 0; i < rows.length; i++) {
            clanData.membersList[i] = {
                memberValue: 0,
                warCount: 0
            };
            clanData.membersList[i].name = await rows[i].findElement(By.css('td:nth-of-type(2) a ')).getText();
            clanData.membersList[i].url = await rows[i].findElement(By.css('td:nth-of-type(2) a')).getAttribute('href');
            clanData.membersList[i].requests = parseInt(await rows[i].findElement(By.css('td:nth-of-type(10)')).getAttribute('data-sort-value'));
            clanData.membersList[i].donations = parseInt(await rows[i].findElement(By.css('td:nth-of-type(9)')).getAttribute('data-sort-value'));
            clanData.membersList[i].trophies = parseInt(await rows[i].findElement(By.css('td:nth-of-type(7)')).getAttribute('data-sort-value'));
            clanData.membersList[i].role = await rows[i].getAttribute('data-role');
            clanData.totalDonations = clanData.totalDonations + clanData.membersList[i].donations;
            clanData.totalRequests = clanData.totalRequests + clanData.membersList[i].requests;
            clanData.totalTrophies = clanData.totalTrophies + clanData.membersList[i].trophies;

        }
        clanData.avgTrophies = clanData.totalTrophies / rows.length;
        clanData.membersList.forEach(member => {
            member.affectDonations = member.donations / clanData.totalDonations * 100;
            member.affectRequests = member.requests / clanData.totalRequests * 100;
            if (member.donations === 0) {
                member.memberValue = member.memberValue - 1
            }
            if (member.requests === 0) {
                member.memberValue = member.memberValue - 2
            }
        })
    })
    .then(() => driver.get(OPTIONS.site + '/war/analytics'))
    .then(() => driver.wait(until.elementLocated(By.css('.war_member'))))
    .then(() => driver.findElements(By.css('.war_member')))
    .then(async rows => {
        for (let i = 0; i < rows.length; i++) {
            let warMemberName = await rows[i].getAttribute('data-name');
            let siteWarCount = parseInt(await rows[i].findElement(By.css('td:nth-of-type(3)')).getAttribute('data-sort-value'));

            for (let m = 0; m < clanData.membersList.length; m++) {
                let member = clanData.membersList[m];

                if (member.name.toLowerCase() === warMemberName.toLowerCase()) {
                    member.warCount = siteWarCount;
                    if (member.role === 'Member' && member.warCount > 3) {
                        let memberLvlUp = true;

                        await rows[i].findElements(By.css('.war_battles'))
                            .then(async warBattles => {
                                for (let w = 0; w < 3; w++) {
                                    let warResult = parseInt(await warBattles[w].getAttribute('data-sort-value'));

                                    if (warResult === 0 || warResult === 1 || warResult === 12) {
                                        memberLvlUp = false;
                                    }
                                }
                            });
                        member.memberLvlUp = memberLvlUp;
                    }
                }
            }

        }
    }).then(() => {
    console.log('==========LVL UP MEMBERS =============');
    clanData.membersList.forEach(member => {
        if (member.memberLvlUp) {
            console.log(member);
        }
    });
    console.log('==========END LVL UP MEMBERS =============');
    }).then(async () => {
    console.log('==========KICK OFF MEMBERS =============');
    for (let i = 0; clanData.membersList.length > i; i++) { //Поки довжина списку з КланМемберами, менше ніж І, збільшувати І на 1, починаючи з 0
        if (clanData.membersList[i].warCount === 0 && clanData.membersList[i].trophies < clanData.avgTrophies) {
            clanData.membersList[i].lastBattle = await getLastBattleTime(clanData.membersList[i]);
            console.log(clanData.membersList[i]);
        }
    }
    console.log('==========END KICK OFF MEMBERS =============')
    }).then(() => {
        driver.close();
    });


function getLastBattleTime(user) {
    return driver.get(user.url + '/battles')
        .then(() => driver.findElement(By.css('.sidemargin0 .two .column')).getText())
        .catch(function () {
            return 'none';
        })
        .then(text => {
            return text;
        });
}