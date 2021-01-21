const { describe, it, before, afterEach } = require('mocha');
const { expect } = require('chai');
const TodoService = require('../src/todoService');
const { createSandbox } = require('sinon');
const Todo = require('../src/todo');

describe('todoService', () => {
  let sandBox;
  before(() => {
    sandBox = createSandbox();
  });

  afterEach(() => sandBox.restore());

  describe('#list', () => {
    const mockDataBase = [
      {
        name: 'XuxaDaSilva',
        age: 90,
        meta: { revision: 0, created: 1611232289242, version: 0 },
        $loki: 1,
      },
    ];
    let todoService;
    beforeEach(() => {
      const dependencies = {
        todoRepository: {
          list: sandBox.stub().returns(mockDataBase),
        },
      };
      todoService = new TodoService(dependencies);
    });

    it('should return data on a specific format', () => {
      const result = todoService.list();
      const [{ meta, $loki, ...expected }] = mockDataBase;
      expect(result).to.be.deep.equal([expected]);
    });
  });

  describe('#create', () => {
    let todoService;
    beforeEach(() => {
      const dependencies = {
        todoRepository: {
          create: sandBox.stub().returns(true),
        },
      };
      todoService = new TodoService(dependencies);
    });

    it("shouldn't save todo item with invalid data", () => {
      const data = new Todo({
        text: '',
        when: '',
      });
      Reflect.deleteProperty(data, 'id');
      const expected = {
        error: {
          message: 'invalid data',
          data: data,
        },
      };
      const result = todoService.create(data);
      expect(result).to.deep.equal(expected);
    });
    it('should save todo item with late status when the property is further than today', () => {
      const properties = {
        text: 'I must walk my dog',
        when: new Date('2020-12-01 12:00:00 GMT-0'),
      };

      const expectedId = '000001';

      const uuid = require('uuid');
      const fakeUUID = sandBox.fake.returns(expectedId);
      sandBox.replace(uuid, 'v4', fakeUUID);

      const data = new Todo(properties);

      const today = new Date('2020-12-02');
      sandBox.useFakeTimers(today.getTime());
      todoService.create(data);

      const expectedCallWith = {
        ...data,
        status: 'late',
      };

      expect(
        todoService.todoRepository.create.calledOnceWithExactly(
          expectedCallWith
        )
      ).to.be.ok;
    });

    it('should save todo item with pending status', () => {
      const properties = {
        text: 'I must walk my dog',
        when: new Date('2020-12-10 12:00:00 GMT-0'),
      };

      const expectedId = '000001';

      const uuid = require('uuid');
      const fakeUUID = sandBox.fake.returns(expectedId);
      sandBox.replace(uuid, 'v4', fakeUUID);

      const data = new Todo(properties);

      const today = new Date('2020-12-02');
      sandBox.useFakeTimers(today.getTime());
      todoService.create(data);

      const expectedCallWith = {
        ...data,
        status: 'pending',
      };

      expect(
        todoService.todoRepository.create.calledOnceWithExactly(
          expectedCallWith
        )
      ).to.be.ok;
    });
  });


});
