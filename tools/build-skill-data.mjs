import {writeFile} from 'fs/promises';

import YAML from "yaml";
import {getAllSkills} from "./lib/util.mjs";

const allSkills = await getAllSkills();
await writeFile('src/skill-data.yml', YAML.stringify(allSkills));
