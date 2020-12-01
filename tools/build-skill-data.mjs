import YAML from "yaml";
import {getAllSkills} from "./lib/util.mjs";

const allSkills = await getAllSkills();
console.log(YAML.stringify(allSkills));
