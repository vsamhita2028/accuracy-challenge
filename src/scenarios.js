// Give every statement a unique, stable id. correctAnswer must match one of them.
export const scenarios = [
  {
    id: 'login',
    title: 'The login feature',
    brief: 'A login feature requires email/password authentication, account lockout after five consecutive failed login attempts, and password reset through a registered email.',
    statements: [
      { id: 'reset', text: 'Users can reset their password through their registered email.' },
      { id: 'lockout', text: 'The account locks after five consecutive failed login attempts.' },
      { id: 'otp', text: 'Users can sign in using their mobile number and OTP.' },
    ],
    correctAnswer: 'otp',
    explanation: 'Mobile OTP login is not part of the defined requirements. It is an unsupported assumption.',
  },
];
