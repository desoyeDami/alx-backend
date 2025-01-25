import { expect } from 'chai';
import { spy } from 'sinon';
import { createQueue } from 'kue';
import createPushNotificationsJobs from './8-job';

describe('createPushNotificationsJobs', () => {
  const queue = createQueue();

      const jobs = [
      {
        phoneNumber: '08065347829',
        message: 'This is the code 09876 to verify your account',
      },
      {
        phoneNumber: '09076546783',
        message: 'This is the code 13579 to verify your account',
      },
    ];

  before(() => {
    queue.testMode.enter();
  });

  afterEach(() => {
    queue.testMode.clear();
  });

  after(() => {
    queue.testMode.exit();
  });

  it('display an error message if jobs is not an array', () => {
    expect(() => createPushNotificationsJobs('hello', queue)).to.throw(Error, 'Jobs is not an array');
  });
  it('create two new jobs to the queue', () => {
    const queueSpy = spy(queue, 'create');
    createPushNotificationsJobs(jobs, queue);
    expect(queueSpy.calledTwice).to.be.true;
    expect(queueSpy.firstCall.args[0]).to.equal('push_notification_code_3');
    expect(queueSpy.firstCall.args[1]).to.deep.equal(jobs[0]);
    expect(queueSpy.secondCall.args[0]).to.equal('push_notification_code_3');
    expect(queueSpy.secondCall.args[1]).to.deep.equal(jobs[1]);
    queueSpy.restore();
  });
});
