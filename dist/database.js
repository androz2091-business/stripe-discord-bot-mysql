"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initialize = exports.Postgres = exports.DiscordCustomer = void 0;
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@adminjs/typeorm");
const class_validator_1 = require("class-validator");
const adminjs_1 = __importDefault(require("adminjs"));
const fastify_1 = __importDefault(require("@adminjs/fastify"));
const fastify_2 = __importDefault(require("fastify"));
const static_1 = __importDefault(require("@fastify/static"));
const path_1 = require("path");
typeorm_2.Resource.validate = class_validator_1.validate;
adminjs_1.default.registerAdapter({ Database: typeorm_2.Database, Resource: typeorm_2.Resource });
let DiscordCustomer = class DiscordCustomer extends typeorm_1.BaseEntity {
    id;
    discordUserId;
    email;
    hadActiveSubscription; // whether the member had an active subscription during last daily check
    firstReminderSentDayCount; // 0 = first day, 1 = second day, 2 = third day, null = no reminder sent
    adminAccessEnabled;
};
exports.DiscordCustomer = DiscordCustomer;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], DiscordCustomer.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        length: 32
    }),
    __metadata("design:type", String)
], DiscordCustomer.prototype, "discordUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        nullable: true // can be null when only admin access is true
    }),
    __metadata("design:type", String)
], DiscordCustomer.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({
        default: false
    }),
    __metadata("design:type", Boolean)
], DiscordCustomer.prototype, "hadActiveSubscription", void 0);
__decorate([
    (0, typeorm_1.Column)({
        nullable: true
    }),
    __metadata("design:type", Number)
], DiscordCustomer.prototype, "firstReminderSentDayCount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        default: false
    }),
    __metadata("design:type", Boolean)
], DiscordCustomer.prototype, "adminAccessEnabled", void 0);
exports.DiscordCustomer = DiscordCustomer = __decorate([
    (0, typeorm_1.Entity)()
], DiscordCustomer);
const entities = [DiscordCustomer];
exports.Postgres = new typeorm_1.DataSource({
    type: 'mysql',
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    entities,
    synchronize: process.env.ENVIRONMENT === 'development',
});
const initialize = () => exports.Postgres.initialize().then(async () => {
    if (process.env.ADMINJS_PORT) {
        const app = (0, fastify_2.default)();
        const admin = new adminjs_1.default({
            branding: {
                companyName: 'Discord Bot'
            },
            resources: entities
        });
        app.register(static_1.default, {
            root: (0, path_1.join)(__dirname, '../public'),
            prefix: '/public/',
        });
        await fastify_1.default.buildAuthenticatedRouter(admin, {
            cookiePassword: process.env.ADMINJS_COOKIE_HASH,
            cookieName: 'adminjs',
            authenticate: async (_email, password) => {
                if (_email)
                    return false;
                if (password === process.env.ADMINJS_PASSWORD) {
                    return true;
                }
            }
        }, app);
        app.listen({
            port: process.env.ADMINJS_PORT
        }, () => {
            console.log(`AdminJS is listening at http://localhost:${process.env.ADMINJS_PORT}`);
        });
    }
});
exports.initialize = initialize;
