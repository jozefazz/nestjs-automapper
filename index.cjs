'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tslib = require('tslib');
var core = require('@automapper/core');
var common = require('@nestjs/common');
var rxjs = require('rxjs');

const DEFAULT_MAPPER_TOKEN = 'automapper:nestjs:default';
function getMapperToken(name) {
    return name ? `automapper:nestjs:${name}` : DEFAULT_MAPPER_TOKEN;
}

var AutomapperModule_1;
exports.AutomapperModule = AutomapperModule_1 = class AutomapperModule {
    static forRoot(mapperOptions, globalOptions) {
        const mappers = Array.isArray(mapperOptions) ? mapperOptions : [Object.assign(Object.assign({}, mapperOptions), {
            name: 'default'
        })];
        const providers = this.createProviders(mappers, globalOptions);
        return {
            module: AutomapperModule_1,
            global: true,
            providers,
            exports: providers
        };
    }
    static forRootAsync(asyncMapperOptions, globalOptions) {
        if (!Array.isArray(asyncMapperOptions)) {
            asyncMapperOptions = [Object.assign(Object.assign({}, asyncMapperOptions), {
                name: 'default'
            })];
        }
        const providers = asyncMapperOptions.flatMap(option => this.createProvider(option, globalOptions));
        return {
            module: AutomapperModule_1,
            global: true,
            providers,
            exports: providers,
            imports: asyncMapperOptions.flatMap(option => option.imports || []) || []
        };
    }
    static createProviders(mapperOptions, globalOptions) {
        return mapperOptions.map(({
                                      name,
                                      namingConventions,
                                      strategyInitializer,
                                      errorHandler
                                  }) => {
            const mapper = core.createMapper({
                strategyInitializer,
                namingConventions: namingConventions || (globalOptions === null || globalOptions === void 0 ? void 0 : globalOptions.globalNamingConventions),
                errorHandler: errorHandler || (globalOptions === null || globalOptions === void 0 ? void 0 : globalOptions.globalErrorHandler)
            });
            return {
                provide: name === 'default' ? getMapperToken() : getMapperToken(name),
                useValue: mapper
            };
        });
    }
    static createProvider(asyncMapperOptions, globalOptions) {
        if (asyncMapperOptions.useExisting || asyncMapperOptions.useFactory) {
            return [this.createMapperProvider(asyncMapperOptions, globalOptions)];
        }
        return [this.createMapperProvider(asyncMapperOptions, globalOptions), {
            provide: asyncMapperOptions.useClass,
            useClass: asyncMapperOptions.useClass
        }];
    }
    static createMapperProvider(asyncMapperOptions, globalOptions) {
        const mapperToken = asyncMapperOptions.name === 'default' ? getMapperToken() : getMapperToken(asyncMapperOptions.name);
        if (asyncMapperOptions.useFactory) {
            return {
                provide: mapperToken,
                useFactory: (...args) => tslib.__awaiter(this, void 0, void 0, function* () {
                    const mapperOptions = yield asyncMapperOptions.useFactory(...args);
                    return this.createMapper(mapperOptions, globalOptions);
                }),
                inject: asyncMapperOptions.inject || []
            };
        }
        return {
            provide: mapperToken,
            useFactory: factory => tslib.__awaiter(this, void 0, void 0, function* () {
                const mapperOptions = yield factory.createAutomapperOptions();
                return this.createMapper(mapperOptions, globalOptions);
            }),
            inject: [asyncMapperOptions.useExisting || asyncMapperOptions.useClass]
        };
    }
    static createMapper(mapperOptions, globalOptions) {
        return core.createMapper({
            strategyInitializer: mapperOptions.strategyInitializer,
            errorHandler: mapperOptions.errorHandler || (globalOptions === null || globalOptions === void 0 ? void 0 : globalOptions.globalErrorHandler),
            namingConventions: mapperOptions.namingConventions || (globalOptions === null || globalOptions === void 0 ? void 0 : globalOptions.globalNamingConventions)
        });
    }
};
exports.AutomapperModule = AutomapperModule_1 = tslib.__decorate([common.Module({})], exports.AutomapperModule);

class AutomapperProfile {
    constructor(mapper) {
        this.mapper = mapper;
        Promise.resolve().then(() => core.addProfile(mapper, this.profile, ...this.mappingConfigurations));
    }
    get mappingConfigurations() {
        return [];
    }
}

const InjectMapper = name => common.Inject(getMapperToken(name));

const defaultKey = 'default';
// eslint-disable-next-line @typescript-eslint/ban-types
function memoize(fn) {
    const cache = {};
    return (...args) => {
        const n = args.reduce((key, arg) => {
            const argToConcat = typeof arg === 'string' ? arg : typeof arg === 'object' ? JSON.stringify(arg) : arg.toString();
            return key.concat('|', argToConcat);
        }, '') || defaultKey;
        if (n in cache) {
            return cache[n];
        }
        const result = n === defaultKey ? fn() : fn(...args);
        cache[n] = result;
        return result;
    };
}

function shouldSkipTransform(mapper, from, to) {
    return !mapper || !to || !from;
}
function transformArray(value, mapper, from, to, options) {
    if (!Array.isArray(value)) return value;
    return mapper === null || mapper === void 0 ? void 0 : mapper.mapArray(value, from, to, options);
}
function getTransformOptions(options) {
    const _a = options || {},
        {
            isArray = false,
            mapperName
        } = _a,
        mapOptions = tslib.__rest(_a, ["isArray", "mapperName"]);
    const transformedMapOptions = core.isEmpty(mapOptions) ? undefined : mapOptions;
    return {
        isArray,
        mapperName,
        transformedMapOptions
    };
}

const MapPipe = memoize(createMapPipe);
function createMapPipe(from, to, options) {
    const {
        isArray,
        mapperName,
        transformedMapOptions
    } = getTransformOptions(options);
    let MixinMapPipe = class MixinMapPipe {
        constructor(mapper) {
            this.mapper = mapper;
        }
        transform(value, {
            type
        }) {
            var _a;
            if (shouldSkipTransform(this.mapper, from, to) || type !== 'body' && type !== 'query') {
                return value;
            }
            try {
                if (isArray) {
                    return transformArray(value, this.mapper, from, to, transformedMapOptions);
                }
                return (_a = this.mapper) === null || _a === void 0 ? void 0 : _a.map(value, from, to, transformedMapOptions);
            } catch (e) {
                return value;
            }
        }
    };
    MixinMapPipe = tslib.__decorate([tslib.__param(0, common.Optional()), tslib.__param(0, InjectMapper(mapperName)), tslib.__metadata("design:paramtypes", [Object])], MixinMapPipe);
    return common.mixin(MixinMapPipe);
}

const MapInterceptor = memoize(createMapInterceptor);
function createMapInterceptor(from, to, options) {
    const {
        isArray,
        mapperName,
        transformedMapOptions
    } = getTransformOptions(options);
    let MixinMapInterceptor = class MixinMapInterceptor {
        constructor(mapper) {
            this.mapper = mapper;
        }
        intercept(context, next) {
            return tslib.__awaiter(this, void 0, void 0, function* () {
                if (shouldSkipTransform(this.mapper, from, to)) {
                    return next.handle();
                }
                try {
                    return next.handle().pipe(rxjs.map(response => {
                        var _a;
                        if (isArray) {
                            return transformArray(response, this.mapper, from, to, transformedMapOptions);
                        }
                        return (_a = this.mapper) === null || _a === void 0 ? void 0 : _a.map(response, from, to, transformedMapOptions);
                    }));
                } catch (_a) {
                    return next.handle();
                }
            });
        }
    };
    MixinMapInterceptor = tslib.__decorate([tslib.__param(0, common.Optional()), tslib.__param(0, InjectMapper(mapperName)), tslib.__metadata("design:paramtypes", [Object])], MixinMapInterceptor);
    return common.mixin(MixinMapInterceptor);
}

exports.AutomapperProfile = AutomapperProfile;
exports.DEFAULT_MAPPER_TOKEN = DEFAULT_MAPPER_TOKEN;
exports.InjectMapper = InjectMapper;
exports.MapInterceptor = MapInterceptor;
exports.MapPipe = MapPipe;
exports.getMapperToken = getMapperToken;