const fs = require('fs');
const path = require('path');
const argv = require('yargs')
    .usage('Usage: $0 -o <output folder> -f <input folder> -i <one or more input files> -p <path to pages directory>')
    .option('input', { alias: 'i', default: null, type: 'array' })
    .alias('o', 'output')
    .alias('p', 'pages')
    .alias('f', 'folder')
    .argv;
const yaml = require('js-yaml');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const getAllYamlFiles = function(dirPath, arrayOfFiles) {
    files = fs.readdirSync(dirPath)
    arrayOfFiles = arrayOfFiles || []
    files.forEach(function(file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            if (file.toLowerCase() != '.git') {
                arrayOfFiles = getAllYamlFiles(dirPath + "/" + file, arrayOfFiles)
            }
        } else {
            if (path.extname(path.join(dirPath, file)).toLowerCase() == '.yml') {
                arrayOfFiles.push(path.join(__dirname, dirPath, "/", file))
            }
        }
    })
    return arrayOfFiles
}

var pagesFolder = argv.pages ? argv.pages.trim() : "";
var outFolder = argv.output.trim();
var inputFiles = [];
if (argv.input && argv.input.length > 0 && argv.input[0]) {
    inputFiles = argv.input.map((x) => { return x.trim(); });
}
var inputFolder = argv.folder ? argv.folder.trim() : "";
var dbOutFolder = path.join(outFolder, "db");
var fileOutFolder = path.join(outFolder, "uploads");

if (fs.existsSync(fileOutFolder)) {
    fs.rmdirSync(fileOutFolder, { recursive: true, force: true });
}
if (!fs.existsSync(fileOutFolder)) {
    fs.mkdirSync(fileOutFolder);
}

var challenge_id = 1;
var flag_id = 1;
var hint_id = 1;
var file_id = 1;
var challenges = { results: [] };
var flags = { results: [] };
var hints = { results: [] };
var challengeFiles = { results: [] };
var integrated = {
    results: []
}

if (inputFolder) {
    inputFiles = inputFiles.concat(getAllYamlFiles(inputFolder));
}

for (var i = 0; i < inputFiles.length; i++) {
    console.log(`Processing ${inputFiles[i]}`)
    var fn = inputFiles[i];
    var fc = fs.readFileSync(fn);
    var work = yaml.safeLoad(fc);
    for (var w = 0; w < work.length; w++) {
        if (work[w].name && work[w].description && work[w].category && work[w].type) {
            chal = {
                id: challenge_id,
                name: work[w].name,
                description: work[w].description,
                max_attempts: work[w].max_attempts ? work[w].max_attempts : 0,
                value: work[w].value,
                category: work[w].category,
                type: work[w].type,
                state: work[w].state
            };
            challenges.results.push(chal);
            if (work[w].flags) {
                for (var f = 0; f < work[w].flags.length; f++) {
                    flag = { id: flag_id, challenge_id: challenge_id, type: work[w].flags[f].type, content: work[w].flags[f].content, data: work[w].flags[f].data ? work[w].flags[f].data : "case_insensitive" };
                    flags.results.push(flag);
                    flag_id++;
                }
            }
            if (work[w].hints) {
                for (var h = 0; h < work[w].hints.length; h++) {
                    hint = { id: hint_id, challenge_id: challenge_id, type: work[w].hints[h].type, content: work[w].hints[h].content, cost: work[w].hints[h].cost, requirements: work[w].hints[h].requirements };
                    hints.results.push(hint);
                    hint_id++;
                }
            }
            if (work[w].type == "integrated") {
                ic = { id: challenge_id, challengeName: work[w].name }
                integrated.results.push(ic);
            }
            if (work[w].files) {
                for (var fi = 0; fi < work[w].files.length; fi++) {
                    var parsed = path.parse(fn);
                    var sourcePath = parsed.dir;
                    var fileName = work[w].files[fi].name;
                    var prefix = crypto.createHash('md5').update(uuidv4()).digest('hex');
                    file = { id: file_id, type: "challenge", challenge_id: challenge_id, page_id: null, location: prefix + '/' + fileName };
                    var destpath = path.join(fileOutFolder, prefix);
                    if (!fs.existsSync(destpath)) {
                        fs.mkdirSync(destpath);
                    }
                    fs.copyFileSync(path.join(sourcePath, fileName), path.join(destpath, fileName));
                    challengeFiles.results.push(file);
                    file_id++;
                }
            }
            challenge_id++;
        }
    }
}

var ct = JSON.stringify(challenges);
var ft = JSON.stringify(flags);
var ht = JSON.stringify(hints);
var it = JSON.stringify(integrated);
var filet = JSON.stringify(challengeFiles);
var challengeOutFile = path.join(dbOutFolder, "challenges.json");
var flagsOutFile = path.join(dbOutFolder, "flags.json");
var hintsOutFile = path.join(dbOutFolder, "hints.json");
var integratedOutFile = path.join(dbOutFolder, "integrated_challenge.json");
var filesOutFile = path.join(dbOutFolder, "files.json");
fs.writeFileSync(challengeOutFile, ct);
fs.writeFileSync(flagsOutFile, ft);
fs.writeFileSync(hintsOutFile, ht);
fs.writeFileSync(integratedOutFile, it);
fs.writeFileSync(filesOutFile, filet);

if (pagesFolder) {
    var pagesFile = path.join(dbOutFolder, "pages.json");
    var pages = JSON.parse(fs.readFileSync(pagesFile));
    if (!pages.results) {
        pages.results = [];
    }
    var content = fs.readdirSync(pagesFolder).map(f => {
        if (path.extname(f).toLowerCase().trim() == ".html") {
            var route = path.basename(f, path.extname(f)).replace("_", "");
            var title = path.basename(f, path.extname(f)).split("_").map(s => {
                return s.charAt(0).toUpperCase() + s.substring(1)
            }).join(" ");
            var content = fs.readFileSync(path.join(pagesFolder, f), 'utf-8').replace(/(\r\n|\n|\r)/gm, "\r\n").replace('"', '\"');
            return { title: title, route: route, content: content };;
        }
    });
    var unmatched = content.filter(c => {
        return pages.results.filter(p => { return p.route == c.route; }).length <= 0;
    });
    var matched = content.filter(c => {
        return pages.results.filter(p => { return p.route == c.route; }).length > 0;
    });
    // update matched
    for (var i = 0; i < matched.length; i++) {
        for (var p = 0; p < pages.results.length; p++) {
            if (pages.results[p].route == matched[i].route) {
                pages.results[p].title = matched[i].title;
                pages.results[p].content = matched[i].content;
            }
        }
    }
    // add unmatched
    var id = pages.count + 1;
    for (var i = 0; i < unmatched.length; i++) {
        var val = { id: id, title: unmatched[i].title, route: unmatched[i].route, content: unmatched[i].content, draft: 0, hidden: 0, auth_required: 0 };
        pages.results.push(val);
        id++;
    }
    pages.count = pages.results.length;
    // write pages data
    fs.writeFileSync(pagesFile, JSON.stringify(pages));
}

console.log(`Wrote data to ${outFolder}`);