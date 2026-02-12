module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'feature',
        'fix',
        'bug',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'ci',
        'build',
        'revert',
        'hotfix',
        'security',
        'wip',
        'merge',
      ],
    ],
    'subject-case': [0],
  },
};
