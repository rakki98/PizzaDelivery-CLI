/*
 * Create and export configuration variables
 *
 */

// Container for all environments
var environments = {};

// Staging (default) environment
environments.staging = {
  'httpPort' : 3000,
  'httpsPort' : 3001,
  'envName' : 'staging',
  'stripe' : {
    'secretKey' : 'sk_test_U0zxLJ8f4TmTU1mOIKbNrhmB'
  },
  'mailgun' : {
    'domainName' : 'https://api.mailgun.net/v3/sandbox9418c99165a34a5d857b6f159d28144a.mailgun.org',
    'apiKey' : 'c1e6a13ac8c27ecebf560955721b94fc-bd350f28-2033430a',
   // 'sender' : 'rakshugs@gmail.com'
  },
   'templateGlobals' : {
    'appName' : 'UptimeChecker',
    'companyName' : 'NotARealCompany, Inc.',
    'yearCreated' : '2018',
    'baseUrl' : 'http://localhost:3000/'
  }
};

// Production environment
environments.production = {
  'httpPort' : 5000,
  'httpsPort' : 5001,
  'envName' : 'production',
  'stripe' : {
    'secretKey' : 'xxx'
  },
  'mailgun' : {
    'domainName' : 'xxx',
    'apiKey' : 'xxx',
    'sender' : 'xxx'
  },
  'templateGlobals' : {
    'appName' : 'UptimeChecker',
    'companyName' : 'NotARealCompany, Inc.',
    'yearCreated' : '2018',
    'baseUrl' : 'http://localhost:3000/'
  }
};

// Determine which environment was passed as a command-line argument
var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the environments above, if not default to staging
var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

// Export the module
module.exports = environmentToExport;