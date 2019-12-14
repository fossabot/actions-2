const find = require('find'),
  yaml = require('js-yaml'),
  fs = require('fs'),
  slugify = require('slugify');

((dir) => {
  const input = (name, config) => {
    return [
      `#### ${name}`,
      '',
      `${config.description}`,
      '',
      `- required: ${config.required ? 'True' : 'False'}`,
      `- default: ${config.required || 'None'}`,
      '',
      '',
    ].join("\n");
  }

  const example = (repo, data) => {
    const required = Object.keys(data.inputs).map(key => {
      if (!data.inputs[key].required) {
        return null;
      }
      return `            ${key}: foobar`;
    }).join("\n");

    return [
      'This example has only required inputs, with dummy data',
      '',
      `    ${slugify(data.name, {lower: true})}:`,
      `      name: ${data.name}`,
      '      runs-on: ubuntu-latest',
      '      steps:',
      '        - uses: actions/checkout@master',
      `        - uses: ${repo}@master`,
      `          ${required ? 'with:' : null}`,
      `${required}`,
      '',
      'This example has all possible inputs, with dummy data.',
      '',
      `    ${slugify(data.name, {lower: true})}:`,
      `      name: ${data.name}`,
      '      runs-on: ubuntu-latest',
      '      steps:',
      '        - uses: actions/checkout@master',
      `        - uses: ${repo}@master`,
      '          with:',
      `${Object.keys(data.inputs).map(key => {
        return `            ${key}: foobar`;
      }).join("\n")}`,
    ].join("\n");
  }

  const parse = (repo, data) => {
    return [
      `# ${data.name} [${data.runs.using} action]`,
      '',
      `${data.description}`,
      '',
      '## Inputs',
      '',
      `${Object.keys(data.inputs).map(key => input(key, data.inputs[key])).join('')}`,
      '',
      '## Example',
      '',
      `${example(repo, data)}`,
      '',
    ].join("\n");
  }

  find.file(/action.ya?ml$/, dir, (files) => {
    const output = files.map(file => {
      const dir = file.split('/github/workspace/')[1].split('/action')[0]
        repo = `${process.env.GITHUB_REPOSITORY}/${dir}`;

      const doc = yaml.safeLoad(fs.readFileSync(file, 'utf8')),
        filename = `${repo.replace(/\//gi, '-')}.md`;

      fs.writeFileSync(`/github/workspace/docs/${filename}`, parse(repo, doc));

      return `- [${doc.name}](./${filename})`
    });

    const readme = `${dir}/docs/README.md`;
    fs.writeFileSync(readme, [
      `# GitHub Actions`,
      '',
      'Below is a list of all the available GitHub actions.',
      '',
      output.join("\n"),
    ].join("\n") + "\n");
  });
})('/github/workspace');