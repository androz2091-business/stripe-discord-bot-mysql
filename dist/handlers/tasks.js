"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadTasks = void 0;
const discord_js_1 = require("discord.js");
const fs_1 = require("fs");
const path_1 = require("path");
const cron_1 = require("cron");
const loadTasks = (client) => {
    const tasks = new discord_js_1.Collection();
    const tasksData = [];
    try {
        (0, fs_1.readdirSync)((0, path_1.join)(__dirname, '..', 'tasks')).forEach(file => {
            if (file.endsWith('.js')) {
                const task = require((0, path_1.join)(__dirname, '..', 'tasks', file));
                if (!task.crons)
                    return console.log(`${file} has no task`);
                const taskName = file.split('.')[0];
                task.jobs = [];
                task.crons.forEach((cron) => {
                    task.jobs.push(new cron_1.CronJob(cron, () => {
                        task.run();
                    }, null, true, 'America/Los_Angeles'));
                });
                tasks.set(taskName, task);
                tasksData.push(task);
                console.log(`Loaded task ${taskName}`);
            }
        });
    }
    catch {
        console.log(`No task found`);
    }
    return {
        tasks,
        tasksData
    };
};
exports.loadTasks = loadTasks;
