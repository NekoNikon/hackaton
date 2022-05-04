module.exports = {
  apps : [{
    script: 'server.js',
      max_memory_restart: 2,
      max_restarts: 5,
      min_uptime: 10000,
      //error_file: '',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
// мертворожденная приблуда