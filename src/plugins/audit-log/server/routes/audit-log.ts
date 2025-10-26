export default [
  {
    method: 'GET',
    path: '/audit-logs',
    handler: 'plugin::audit-log.audit-log.find',
    config: {
      auth: false,
      policies: ['plugin::audit-log.can-read-audit-logs'],
    },
  },
];
