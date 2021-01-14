/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

const assert = require("assert");
const { commands, Uri } = require("vscode");
const path = require("path");
const fs = require("fs");

const fixturesPath = path.normalize(
  path.join(__dirname, "..", "colorize-fixtures")
);

function assertUnchangedTokens(fixture) {
  const fixurePath = path.join(fixturesPath, fixture);

  return commands
    .executeCommand("_workbench.captureSyntaxTokens", Uri.file(fixurePath))
    .then(
      (data) =>
        new Promise((resolve, reject) => {
          try {
            let resultsFolderPath = path.join(
              path.dirname(path.dirname(fixurePath)),
              "colorize-results"
            );
            if (!fs.existsSync(resultsFolderPath)) {
              fs.mkdirSync(resultsFolderPath);
            }
            let resultPath = path.join(
              resultsFolderPath,
              fixture.replace(".", "_") + ".json"
            );
            if (fs.existsSync(resultPath)) {
              let previousData = JSON.parse(
                fs.readFileSync(resultPath).toString()
              );
              try {
                assert.deepStrictEqual(data, previousData);
              } catch (e) {
                fs.writeFileSync(resultPath, JSON.stringify(data, null, "\t"), {
                  flag: "w",
                });
                if (
                  Array.isArray(data) &&
                  Array.isArray(previousData) &&
                  data.length === previousData.length
                ) {
                  for (let i = 0; i < data.length; i++) {
                    let d = data[i];
                    let p = previousData[i];
                    if (d.c !== p.c || hasThemeChange(d.r, p.r)) {
                      throw e;
                    }
                  }
                  // different but no tokenization ot color change: no failure
                } else {
                  throw e;
                }
              }
            } else {
              fs.writeFileSync(resultPath, JSON.stringify(data, null, "\t"));
            }
            resolve();
          } catch (e) {
            reject(e);
          }
        })
    );
}

function hasThemeChange(d, p) {
  let keys = Object.keys(d);
  for (let key of keys) {
    if (d[key] !== p[key]) {
      return true;
    }
  }
  return false;
}

suite("colorization", () => {
  const fixtures = fs.readdirSync(fixturesPath);

  for (const fixture of fixtures) {
    test(fixture, async function () {
      await assertUnchangedTokens(fixture);
    });
  }
});
