import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import semVer from 'semver';

const contributors = [
    {
        "name": "Kishan Parmar",
        "login": "kishanprmr"
    },
    {
        "name": "Mohammad AbuAboud",
        "login": "abuaboud"
    },
    {
        "name": "Damien HEBERT",
        "login": "doskyft"
    },
    {
        "name": "AbdulTheActivePiecer",
        "login": "AbdulTheActivePiecer"
    },
    {
        "name": "Moayyad Shaddad",
        "login": "MoShizzle"
    },
    {
        "name": "TaskMagicKyle",
        "login": "TaskMagicKyle"
    },
    {
        "name": "kylebuilds",
        "login": "TaskMagicKyle"
    },
    {
        "name": "Salem-Alaa",
        "login": "Salem-Alaa"
    },
    {
        "name": "Khaled Mashaly",
        "login": "khaledmashaly"
    },
    {
        "name": "abuaboud",
        "login": "abuaboud"
    },
    {
        "name": "Mohammed Abu Aboud",
        "login": "abuaboud"
    },
    {
        "name": "Mukewa O. Wekalao",
        "login": "kanarelo"
    },
    {
        "name": "Willian",
        "login": "Willianwg"
    },
    {
        "name": "Aler Denisov",
        "login": "alerdenisov"
    },
    {
        "name": "Abdallah-Alwarawreh",
        "login": "Abdallah-Alwarawreh"
    },
    {
        "name": "Shay Punter",
        "login": "ShayPunter"
    },
    {
        "name": "i-nithin",
        "login": "i-nithin"
    },
    {
        "name": "Joe Workman",
        "login": "joeworkman"
    },
    {
        "name": "ShayPunter",
        "login": "ShayPunter"
    },
    {
        "name": "Vraj Gohil",
        "login": "VrajGohil"
    },
    {
        "name": "Matthew Zeiler",
        "login": "zeiler"
    },
    {
        "name": "Alexandros Katechis",
        "login": "akatechis"
    },
    {
        "name": "JanHolger",
        "login": "JanHolger"
    },
    {
        "name": "Andrei Chirko",
        "login": "andchir"
    },
    {
        "name": "Landon Moir",
        "login": "landonmoir"
    },
    {
        "name": "bibhuty-did-this",
        "login": "bibhuty-did-this"
    },
    {
        "name": "Cyril Selasi",
        "login": "cyrilselasi"
    },
    {
        "name": "Gunther Schulz",
        "login": "Gunther-Schulz"
    },
    {
        "name": "Osama Zakarneh",
        "login": "Ozak93"
    },
    {
        "name": "Owlcept",
        "login": "Owlcept"
    },
    {
        "name": "Drew Lewis",
        "login": "Owlcept"
    },
    {
        "name": "AbdullahBitar",
        "login": "AbdullahBitar"
    },
    {
        "name": "Mohammad Abuaboud",
        "login": "abuaboud"
    },
    {
        "name": "BBND",
        "login": "BBND"
    },
    {
        "name": "Nilesh",
        "login": "Nilesh"
    },
    {
        "name": "Karim Khaleel",
        "login": "karimkhaleel"
    },
    {
        "name": "[NULL] Dev",
        "login": "Abdallah-Alwarawreh"
    },
    {
        "name": "Pablo Fernandez",
        "login": "pfernandez98"
    },
    {
        "name": "BastienMe",
        "login": "BastienMe"
    },
    {
        "name": "Olivier Sambourg",
        "login": "AdamSelene"
    },
    {
        "name": "MoShizzle",
        "login": "MoShizzle"
    },
    {
        "name": "Aasim Sani",
        "login": "aasimsani"
    },
    {
        "name": "Abdul-rahman Yasir Khalil",
        "login": "AbdulTheActivePiecer"
    },
    {
        "name": "awais",
        "login": "awais"
    },
    {
        "name": "Lisander Lopez",
        "login": "lisander-lopez"
    },
    {
        "name": "OsamaHaikal",
        "login": "OsamaHaikal"
    },
    {
        "name": "Maher",
        "login": "abaza738"
    },
    {
        "name": "Maher Abaza",
        "login": "abaza738"
    },
    {
        "name": "Mukewa Wekalao",
        "login": "kanarelo"
    },
    {
        "name": "Mark van Bellen",
        "login": "buttonsbond"
    },
    {
        "name": "Denis Gurskij",
        "login": "DGurskij"
    },
    {
        "name": "Thibaut Patel",
        "login": "tpatel"
    },
    {
        "name": "Bastien Meffre",
        "login": "BastienMe"
    },
    {
        "name": "Abdullah Ranginwala",
        "login": "abdullahranginwala"
    },
    {
        "name": "pfernandez98",
        "login": "pfernandez98"
    },
    {
        "name": "Vitali Borovi",
        "login": "Vitalini"
    },
    {
        "name": "Vitali Borovik",
        "login": "Vitalini"
    },
    {
        "name": "Vitalik Borovik",
        "login": "Vitalini"
    },
    {
        "name": "Armand Giauffret 4",
        "login": "ArmanGiau3"
    },
    {
        "name": "Armand Giauffret 3",
        "login": "ArmanGiau3"
    },
    {
        "name": "Salem Alwarawreh",
        "login": "Salem-Alaa"
    },
    {
        "name": "MyWay",
        "login": "MyWay"
    },
    {
        "name": "leenmashni",
        "login": "leenmashni"
    },
    {
        "name": "Fábio Ferreira",
        "login": "facferreira"
    },
    {
        "name": "Diego Nijboer",
        "login": "lldiegon"
    },
    {
        "name": "Enrike Nur",
        "login": "w95"
    },
    {
        "name": "Haithem BOUJRIDA",
        "login": "hkboujrida"
    },
    {
        "name": "Willian Guedes",
        "login": "Willianwg"
    },
    {
        "name": "Daniel Ostapenko",
        "login": "denieler"
    },
    {
        "name": "Yann Petitjean",
        "login": "yann120"
    },
    {
        "name": "Lawrence Li",
        "login": "la3rence"
    },
    {
        "name": "Mario Meyer",
        "login": "mariomeyer"
    },
    {
        "name": "aboudzein",
        "login": "aboudzein",
    },
    {
        "name": "aboudzeineddin",
        "login": "aboudzein",
    },
    {
        "name": "Alexander Storozhevsky",
        "login": "astorozhevsky"
    },
    {
        "name": "dentych",
        "login": "dentych"
    },
    {
        "name": "Matt Lung",
        "login": "Vitalini"
    },
    {
        "name": "joselupianez",
        "login": "joselupianez"
    },
    {
        "name": "Hoang Duc Tan",
        "login": "tanoggy"
    },
    {
        "name": "Herman Kudria",
        "login": "HKudria"
    },
    {
        "name": "Ahmad Ghosheh",
        "login": "BLaidzX"
    },
    {
        "name": "Ben",
        "login": "bendersej"
    },
    {
        "name": "Rita Gorokhod",
        "login": "rita-gorokhod"
    },
    {
        name: "Dennis Rongo",
        login: "dennisrongo"
    },
    {
        "name": "x7airworker",
        "login": "x7airworker"
    },
    {
        "name": "Camilo Usuga",
        "login": "camilou"
    },
    {
        "name": "Fardeen Panjwani",
        "login": "fardeenpanjwani-codeglo"
    },
    {
        "name": "Tân Một Nắng",
        "login": "tanoggy"
    },
    {
        "name": "ashrafsamhouri",
        "login": "ashrafsamhouri"
    },
    {
        "name": "Ahmad-AbuOsbeh",
        "login": "Ahmad-AbuOsbeh"
    },
    {
        "name": "Fastkop",
        "login": "abuaboud"
    },
    {
        "name": "Abdul",
        "login": "AbdulTheActivePiecer"
    },
    {
        "name": "ahmad jaber",
        "login": "creed983",
    },
    {
        "name": "creed983",
        "login": "creed983",
    },
    {
        "name": "Activepieces Dev",
        "login": "ashrafsamhouri"
    },
    {
        "name": "hiasat",
        "login": "abuaboud"
    },
    {
        "name": "Mohammad",
        "login": "abuaboud"
    },
    {
        "name": "ActivePieces",
        "login": "abuaboud"
    },
    {
        "name": "haseebrehmanpc",
        "login": "haseebrehmanpc"
    },
    {
        "name": "Haseeb Rehman",
        "login": "haseebrehmanpc"
    }
]

function cleanAuthors(authors: string[]) {
    const cleanedAuthors: string[] = []
    authors.forEach(author => {
        const contributor = contributors.find(contributor => contributor.name === author);
        if (contributor) {
            cleanedAuthors.push(contributor.login);
        } else {
            throw new Error(`Author ${author} not found`);
        }
    });

    return cleanedAuthors;
}

function loadAuthors(directoryPath: string) {
    const gitLogCommand = `git log --format="%aN" -- ${directoryPath}`;
    const result = execSync(gitLogCommand, { cwd: '/workspace/', encoding: 'utf-8' });
    if (result.length === 0) {
        return [];
    }
    const authors = result.trim().split('\n');
    authors.forEach(author => {
        if (!contributors.find(contributor => contributor.name === author)) {
            throw new Error(`Author ${author} not found in ${directoryPath}`);
        }
    })
    return authors;
}

function loadSrcIndexFiles(directoryPath: string) {
    const files = fs.readdirSync(directoryPath);
    files.forEach(file => {
        const filePath = path.join(directoryPath, file);
        const stats = fs.statSync(filePath);
        if (file === 'tmp' || file === 'framework' || file === 'common') return;
        if (stats.isDirectory()) {
            const indexPath = path.join(filePath, 'src', 'index.ts');
            if (fs.existsSync(indexPath)) {
                const authorsOne = cleanAuthors(loadAuthors(filePath));
                const authorsTwo = cleanAuthors(loadAuthors(filePath.replace('/community', '')));
                const authorsThree = cleanAuthors(loadAuthors(filePath.replace('/community', '/src/lib/apps')));
                const authorsFour = cleanAuthors(loadAuthors(filePath.replace('/community', '/src/apps')));
                const uniqueAuthors = customSort([...new Set([...authorsOne, ...authorsTwo, ...authorsThree, ...authorsFour])]);
                console.log(uniqueAuthors);

                const fileContent = fs.readFileSync(indexPath, { encoding: 'utf-8' });

                const pattern = /authors: \[(.*?)\]/;

                if (!pattern.test(fileContent)) {
                    throw new Error("Pattern 'authors: [...] not found in the file content. " + indexPath);
                }

                const modifedContent = fileContent.replace(/authors: \[(.*?)\]/, `authors: ${JSON.stringify(uniqueAuthors)}`);
                fs.writeFileSync(indexPath, modifedContent, { encoding: 'utf-8' });

                const packageJson = path.join(filePath, 'package.json');
                const packageJsonContent = JSON.parse(fs.readFileSync(packageJson, { encoding: 'utf-8' }));
                packageJsonContent.version = semVer.inc(packageJsonContent.version, 'patch');
                fs.writeFileSync(packageJson, JSON.stringify(packageJsonContent, null, 2), { encoding: 'utf-8' });
            }
        }
    });
}

// Sort the offical team members last.
const authorsOrder = ['Abdallah-Alwarawreh', 'Salem-Alaa', 'kishanprmr', 'MoShizzle', 'AbdulTheActivePiecer', 'khaledmashaly', 'abuaboud'].map(author => author.toLocaleLowerCase());

function customSort(authors: string[]): string[] {
    return authors.sort((a, b) => {
        const indexA = authorsOrder.indexOf(a.toLocaleLowerCase());
        const indexB = authorsOrder.indexOf(b.toLocaleLowerCase());

        // If either author is not found in the specified order, move it to the end
        if (indexA === -1) return -1;
        if (indexB === -1) return 1;

        // Sort based on the index in the specified order
        return indexA - indexB;
    });
}
const directoryToTraverse = '/workspace/packages/pieces/community'
loadSrcIndexFiles(directoryToTraverse);

