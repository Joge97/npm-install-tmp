import * as fs from 'fs';
import * as npm from 'npm';
import * as npa from 'npm-package-arg';
import * as path from 'path';
import * as readPackageJson from 'read-package-json';
import * as semver from 'semver';
import * as tmp from 'tmp';


tmp.setGracefulCleanup();

async function createTemporaryDirectory(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        tmp.dir({unsafeCleanup: true}, (err, directoryPath) => {
            if(err) return reject(err);
            resolve(directoryPath);
        });
    });
}

let temporaryDirectory;

async function getTemporaryDirectory(): Promise<string> {
    if(!temporaryDirectory) {
        temporaryDirectory = await createTemporaryDirectory();
    }

    return temporaryDirectory;
}

interface ParsedPackageArgument {
    type: 'git' | 'tag' | 'version' | 'range' | 'file' | 'directory' | 'remote';
    name?: string;
    fetchSpec?: string;
}

function parsePackageArgument(directory: string, packageArgument: string): ParsedPackageArgument {
    return npa(packageArgument, directory);
}

async function existsPackage(directory: string, parsedPackageArgument: ParsedPackageArgument): Promise<boolean> {
    const packageDirectory = path.join(directory, parsedPackageArgument.name);

    if (parsedPackageArgument.type.match(/^(tag|version|range)$/)) {
        return new Promise<boolean>(resolve=> {
            fs.access(packageDirectory, noAccessError => {
                if(noAccessError) {
                    resolve(false);
                } else {
                    readPackageJson(path.join(packageDirectory, 'package.json'), (readPackageJsonError, data) => {
                        if(readPackageJsonError) {
                            resolve(false);
                        } else {
                            resolve((parsedPackageArgument.type === 'range' ?
                                semver.satisfies :
                                semver.eq)(JSON.parse(data).version, parsedPackageArgument.fetchSpec));
                        }
                    });
                }
            });
        });
    } else {
        // NOTE: can not compare git repositories, files, directories and remotes
        return false;
    }
}

async function install(directoryPath: string, moduleName: string): Promise<[[string, string]]> {
    return new Promise<[[string, string]]>((resolve, reject) => {
        npm.load({loglevel: 'silent', progress: false}, () => {
            npm.commands.install(directoryPath, [moduleName], (err, modules) => {
                if(err) return reject(err);
                resolve(modules);
            });
        });
    });
}

function getPackagePath(packages: string[][], packageArgument: string): string {
    if(packages.length > 0) {
        for(const module of packages) {
            // NOTE: this only works if the type of the packageArgument is tag, version or range
            if(module.length >= 2 && module[0].startsWith(packageArgument)) {
                return module[1];
            }
        }
    }

    throw new Error('Could not resolve module path!');
}

export async function use(packageArgument: string, useSameDirectory = false): Promise<any> {
    let directory;

    if(useSameDirectory) {
        directory = await getTemporaryDirectory();
        const parsedPackageArgument = parsePackageArgument(directory, packageArgument);
        const exists = await existsPackage(directory, parsedPackageArgument);

        if(exists) {
            return require(path.join(directory, parsedPackageArgument.name));
        }
    } else {
        directory = await createTemporaryDirectory();
    }

    const modules = await install(directory, packageArgument);

    return require(getPackagePath(modules, packageArgument));
}
