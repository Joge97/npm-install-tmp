import * as npm from 'npm';
import * as tmp from 'tmp';


tmp.setGracefulCleanup();

function createTemporaryDirectory(): Promise<string> {
    return new Promise((resolve, reject) => {
        tmp.dir({unsafeCleanup: true}, (err, directoryPath) => {
            if(err) return reject(err);
            resolve(directoryPath);
        });
    });
}

function install(directoryPath: string, moduleName: string): Promise<string[][]> {
    return new Promise((resolve, reject) => {
        npm.load({loglevel: 'silent', progress: false}, () => {
            npm.commands.install(directoryPath, [moduleName], (err, modules) => {
                if(err) return reject(err);
                resolve(modules);
            });
        });
    });
}

function getModulePath(modules: string[][], moduleName: string): Promise<string> {
    if(modules.length > 0) {
        for(const module of modules) {
            if(module.length >= 2 && module[0].startsWith(moduleName)) return Promise.resolve(module[1]);
        }
    }

    return Promise.reject(new Error('Could not resolve module path!'));
}

export function use(moduleName: string): Promise<any> {
    return createTemporaryDirectory()
        .then(directoryPath => install(directoryPath, moduleName))
        .then(modules => getModulePath(modules, moduleName))
        .then(modulePath => require(modulePath));
}
