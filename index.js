require('ts-node').register({
    transpileOnly: true,
    files: true,
    compilerOptions: {
      module: 'commonjs',
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
    }
  });
  
  require('./src/server.ts');