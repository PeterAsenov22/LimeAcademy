# CryptoCarsDapp

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 6.0.8. Please read the `development server` part before trying to run the project.

## Development server

Install all packages with `npm install`. After that navigate to `node_modules/@angular-devkit/build-angular/src/angular-cli-files/models/webpack-configs/browser.js` file and do the following change:
`node: {
            crypto: true,
            stream: true,
            os: true,
            buffer: true,
            path: true
      }`.
Now run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
