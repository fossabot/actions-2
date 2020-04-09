const slugify = require('slugify');

module.exports = (() => {
  const self = {};

  self.slug = words => slugify(words).toLowerCase();

  self.job = job => {
    if (job.include === false) {
      return {};
    }

    delete job.include;

    const slug = self.slug(job.name);
    if (!job['runs-on']) {
      job['runs-on'] = 'ubuntu-latest';
    }
    return {
      [slug]: job,
    }
  };

  self.collector = (name, needs) => {
    needs = Object.keys(needs).filter(key => needs[key] ? key : false);
    if (needs.length <= 0) {
      return {};
    }

    return self.job({
      name,
      needs: needs,
      steps: [{ run: true }],
    })
  };

  self.run = (name, commands) => {
    commands = Array.isArray(commands) ? commands : [commands];
    commands.push('');
    return {
      name,
      run: commands.join("\n")
    };
  };

  self.checkout = (depth) => ({
    name: 'Checkout',
    uses: 'actions/checkout@master',
    with: {
      'fetch-depth': Number.isInteger(depth) ? depth : 1,
    },
  });

  self.fileChecks = (config) => {
    const ret = [];
    for (name in config) {
      const conf = {
        name,
        uses: 'dogmatic69/actions/file/lint/awesome-ci@master',
        with: {
          command: `file-${name}`,
        },
      };
      config[name] = Array.isArray(config[name]) ? config[name] : [config[name]]
      config[name] = config[name].filter(name => !!name)
      if (config[name].length > 0) {
        conf.with.ignore = config[name].join(',')
      }
      ret.push(conf);
    }

    return ret;
  };

  self.additionalSteps = (steps) => {
    return (Object.keys(steps || {})).map(step => {
      const config = steps[step];

      if (typeof config === 'string') {
        return {
          name: step,
          uses: config,
        };
      }
      config.name = config.name || step;
      return config;
    });
  }

  self.gitChecks = (config) => {
    return (config || []).map(check => ({
      name: `Git ${check}`,
      uses: 'dogmatic69/actions/git/lint/awesome-ci@master',
      with: {
        command: `git-${check}`,
      },
    }));
  };

  return self;
})();
