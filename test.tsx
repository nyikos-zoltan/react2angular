import {
  bootstrap,
  element as $,
  IAugmentedJQuery,
  ICompileService,
  IComponentOptions,
  IController,
  IHttpService,
  IQService,
  IScope,
  module,
} from 'angular';
import * as angular from 'angular';
import 'angular-mocks';
import { $http, $q, $rootScope } from 'ngimport';
import * as PropTypes from 'prop-types';
import * as React from 'react';
import { act, Simulate } from 'react-dom/test-utils';
import { react2angular } from './';

class TestOne extends React.Component<Props> {
  render() {
    return (
      <div>
        <p>Foo: {this.props.foo}</p>
        <p>Bar: {this.props.bar.join(',')}</p>
        <p onClick={() => this.props.baz(42)}>Baz</p>
        {this.props.children}
      </div>
    );
  }
  componentWillUnmount() {}
}

const TestTwo = (props: Props) => (
  <div>
    <p>Foo: {props.foo}</p>
    <p>Bar: {props.bar.join(',')}</p>
    <p onClick={() => props.baz(42)}>Baz</p>
    {props.children}
  </div>
);

const TestThree = () => <div>Foo</div>;

class TestFour extends React.Component<Props> {
  render() {
    return <div>Foo</div>;
  }
}

class TestFive extends React.Component<Props> {
  static propTypes = {
    bar: PropTypes.array.isRequired,
    baz: PropTypes.func.isRequired,
    foo: PropTypes.number.isRequired,
  };

  render() {
    return (
      <div>
        <p>Foo: {this.props.foo}</p>
        <p>Bar: {this.props.bar.join(',')}</p>
        <p onClick={() => this.props.baz(42)}>Baz</p>
        {this.props.children}
      </div>
    );
  }
  componentWillUnmount() {}
}

class TestSixService {
  constructor(private $q: IQService) {}

  foo() {
    return this.$q.resolve('testSixService result');
  }
}

type DIProps = {
  $element: IAugmentedJQuery;
  $http: IHttpService;
  testSixService: TestSixService;
};

class TestSix extends React.Component<Props & DIProps> {
  state = {
    elementText: '',
    result: '',
    testSixService: '',
  };

  render() {
    return (
      <div>
        <p>{this.state.result}</p>
        <p>{this.state.elementText}</p>
        <p>{this.state.testSixService}</p>
        <p>{this.props.foo}</p>
        <span>$element result</span>
      </div>
    );
  }

  componentDidMount() {
    this.setState({
      elementText: this.props.$element.find('span').text(),
    });
    this.props.$http.get('https://example.com/').then((_) => this.setState({ result: _.data }));
    this.props.testSixService.foo().then((_) => this.setState({ testSixService: _ }));
  }
}

function TestSeven(props: Props) {
  return <p>{props.foo}</p>;
}

interface TestEightProps {
  onChange: jasmine.Spy;
  onComponentWillUnmount: jasmine.Spy;
  onRender: jasmine.Spy;
  values: string[];
}

class TestEight extends React.Component<TestEightProps> {
  render() {
    this.props.onRender();
    return this.props.values.map((value, index) => <div key={index}>{value}</div>);
  }

  componentWillUnmount() {
    this.props.onComponentWillUnmount();
    this.props.onChange(this.props.values.map((val) => `${val}ss`));
  }
}

class TestEightWrapper implements IComponentOptions {
  bindings = {
    onComponentWillUnmount: '<',
    onRender: '<',
    values: '<',
  };
  template = `<test-angular-eight
                on-change="$ctrl.onChange"
                on-component-will-unmount="$ctrl.onComponentWillUnmount"
                on-render="$ctrl.onRender"
                values="$ctrl.values">
              </test-angular-eight>`;
  controller = class implements IController {
    values!: string[];

    constructor(private $scope: IScope) {}

    onChange = (values: string[]) => {
      this.values = values;
      this.$scope.$apply();
    };
  };
}

const TestNine = ({ destroyCb }: { destroyCb: () => void }) => {
  React.useEffect(() => {
    return () => {
      destroyCb();
    };
  }, [destroyCb]);
  return <div></div>;
};

const TestAngularOne = react2angular(TestOne, ['foo', 'bar', 'baz']);
const TestAngularTwo = react2angular(TestTwo, ['foo', 'bar', 'baz']);
const TestAngularThree = react2angular(TestThree);
const TestAngularFour = react2angular(TestFour);
const TestAngularSix = react2angular(TestSix, ['foo'], ['$http', '$element', 'testSixService', 'foo']);
const TestAngularSeven = react2angular(TestSeven, null, ['foo']);
const TestAngularEight = react2angular(TestEight, ['values', 'onComponentWillUnmount', 'onRender', 'onChange']);
const TestAngularNine = react2angular(TestNine, ['destroyCb']);

module('test', ['bcherny/ngimport'])
  .component('testAngularOne', TestAngularOne)
  .component('testAngularTwo', TestAngularTwo)
  .component('testAngularThree', TestAngularThree)
  .component('testAngularFour', TestAngularFour)
  .service('testSixService', ['$q', TestSixService])
  .constant('foo', 'CONSTANT FOO')
  .component('testAngularSix', TestAngularSix)
  .component('testAngularSeven', TestAngularSeven)
  .component('testAngularEight', TestAngularEight)
  .component('testAngularEightWrapper', new TestEightWrapper())
  .component('testAngularNine', TestAngularNine);

bootstrap($(), ['test'], { strictDi: true });

interface Props {
  bar: boolean[];
  baz(value: number): any;
  foo: number;
  children?: React.ReactNode;
}

describe('react2angular', () => {
  let $compile: ICompileService;
  let currentScope: IScope | undefined;
  function useScope<T = Record<string, never>>(locals?: T): IScope & T {
    currentScope = $rootScope.$new(true);
    if (locals) {
      Object.assign(currentScope, locals);
    }

    const originalApply = currentScope.$apply.bind(currentScope);
    currentScope.$apply = (arg?) => {
      act(() => originalApply(arg as any));
    };
    const originalDestroy = currentScope.$destroy.bind(currentScope);
    currentScope.$destroy = () => {
      act(() => originalDestroy());
    };

    return currentScope as IScope & T;
  }

  function render(html: string) {
    const element = $(html);
    act(() => {
      if (!currentScope) {
        currentScope = useScope();
      }
      $compile(element)(currentScope);
      $rootScope.$apply();
    });
    return element;
  }

  beforeEach(() => {
    angular.mock.module('test');
    angular.mock.inject(function (_$compile_: ICompileService) {
      $compile = _$compile_;
    });
  });

  afterEach(() => {
    if (currentScope) {
      act(() => currentScope.$destroy());
    }
  });

  describe('initialization', () => {
    it('should give an angular component', () => {
      expect(TestAngularOne.bindings).not.toBe(undefined);
      expect(TestAngularOne.controller).not.toBe(undefined);
    });

    it('should use the propTypes when present and no bindingNames were specified', () => {
      const reactAngularComponent = react2angular(TestFive);

      expect(reactAngularComponent.bindings).toEqual({
        bar: '<',
        baz: '<',
        foo: '<',
      });
    });

    it('should use the bindingNames when present over the propTypes', () => {
      const reactAngularComponent = react2angular(TestFive, ['foo']);

      expect(reactAngularComponent.bindings).toEqual({
        foo: '<',
      });
    });

    it('should have empty bindings when parameter is an empty array', () => {
      const reactAngularComponent = react2angular(TestFive, []);
      expect(reactAngularComponent.bindings).toEqual({});
    });

    it('should have empty bindings when parameter is not passed', () => {
      expect(react2angular(TestThree).bindings).toEqual({});
    });

    it('should use the injectNames for DI', () => {
      const defaultDi = (react2angular(TestThree).controller as any).slice(0, -1);
      const injectedDi = (react2angular(TestThree, null, ['foo', 'bar']).controller as any).slice(0, -1);
      expect(injectedDi).toEqual(defaultDi.concat(['foo', 'bar']));
    });

    it('should have default DI specifications if injectNames is empty', () => {
      const defaultDi = (react2angular(TestThree).controller as any).slice(0, -1);
      const injectedDi = (react2angular(TestThree, null, []).controller as any).slice(0, -1);
      expect(injectedDi).toEqual(defaultDi);
    });
  });

  describe('react classes', () => {
    it('should render', () => {
      const scope = useScope({
        bar: [true, false],
        baz: (value: number) => value + 1,
        foo: 1,
      });
      const element = $('<test-angular-one foo="foo" bar="bar" baz="baz"></test-angular-one>');
      act(() => {
        $compile(element)(scope);
        $rootScope.$apply();
      });
      expect(element!.find('p').length).toBe(3);
    });

    it('should render (even if the component takes no props)', () => {
      const element = render('<test-angular-four></test-angular-four>');
      expect(element.text()).toBe('Foo');
    });

    it('should update', () => {
      const scope = useScope({
        bar: [true, false],
        baz: (value: number) => value + 1,
        foo: 1,
      });
      const element = render('<test-angular-one foo="foo" bar="bar" baz="baz"></test-angular-one>');
      expect(element.find('p').eq(1).text()).toBe('Bar: true,false');
      scope.$apply(() => (scope.bar = [false, true, true]));
      expect(element.find('p').eq(1).text()).toBe('Bar: false,true,true');
    });

    it('should destroy', () => {
      const scope = useScope({
        bar: [true, false],
        baz: (value: number) => value + 1,
        foo: 1,
      });
      render('<test-angular-one foo="foo" bar="bar" baz="baz"></test-angular-one>');

      const componentWillUnmountSpy = jest.spyOn(TestOne.prototype, 'componentWillUnmount');
      scope.$destroy();
      expect(componentWillUnmountSpy).toHaveBeenCalled();
    });
  });

  it('should take callbacks', () => {
    const baz = jest.fn();
    useScope({
      bar: [true, false],
      baz,
      foo: 1,
    });
    const element = render('<test-angular-one foo="foo" bar="bar" baz="baz"></test-angular-one>');
    Simulate.click(element.find('p').eq(2)[0]);
    expect(baz).toHaveBeenCalledWith(42);
  });

  // TODO: support children
  it('should not support children', () => {
    useScope({
      bar: [true, false],
      baz: (value: number) => value + 1,
      foo: 1,
    });
    const element = render(
      '<test-angular-one foo="foo" bar="bar" baz="baz"><span>Transcluded</span></test-angular-one>',
    );
    expect(element.find('span').length).toBe(0);
  });

  it('should take injections, which override props', () => {
    jest.spyOn($http, 'get').mockReturnValue($q.resolve({ data: '$http response' } as angular.IHttpResponse<unknown>));
    useScope({
      foo: 'FOO',
    });

    const element1 = render('<test-angular-six foo="foo"></test-angular-six>');
    const element2 = render('<test-angular-seven foo="foo"></test-angular-seven>');

    $rootScope.$apply();

    expect($http.get).toHaveBeenCalledWith('https://example.com/');
    expect(element1.find('p').eq(0).text()).toBe('$http response');
    expect(element1.find('p').eq(1).text()).toBe('$element result');
    expect(element1.find('p').eq(2).text()).toBe('testSixService result');
    expect(element1.find('p').eq(3).text()).toBe('CONSTANT FOO');
    expect(element2.find('p').text()).toBe('CONSTANT FOO');
  });

  describe('react functional components', () => {
    it('should render', () => {
      useScope({
        bar: [true, false],
        baz: (value: number) => value + 1,
        foo: 1,
      });
      const element = render('<test-angular-two foo="foo" bar="bar" baz="baz"></test-angular-two>');
      expect(element.find('p').length).toBe(3);
    });

    it('should render (even if the component takes no props)', () => {
      const element = render('<test-angular-three></test-angular-three>');
      expect(element.text()).toBe('Foo');
    });

    it('should update', () => {
      const scope = useScope({
        bar: [true, false],
        baz: (value: number) => value + 1,
        foo: 1,
      });
      const element = render('<test-angular-two foo="foo" bar="bar" baz="baz"></test-angular-two>');
      expect(element.find('p').eq(1).text()).toBe('Bar: true,false');
      scope.$apply(() => (scope.bar = [false, true, true]));
      expect(element.find('p').eq(1).text()).toBe('Bar: false,true,true');
    });

    it('should destroy', () => {
      const foo = jest.fn();
      const scope = useScope({ foo });
      render('<test-angular-nine destroy-cb="foo"></test-angular-nine>');
      scope.$destroy();
      expect(foo).toHaveBeenCalledTimes(1);
    });

    it('should take callbacks', () => {
      const baz = jest.fn();
      useScope({
        bar: [true, false],
        baz,
        foo: 1,
      });
      const element = render('<test-angular-two foo="foo" bar="bar" baz="baz"></test-angular-two>');
      Simulate.click(element.find('p').eq(2)[0]);
      expect(baz).toHaveBeenCalledWith(42);
    });

    // TODO: support children
    it('should not support children', () => {
      useScope({
        bar: [true, false],
        baz: (value: number) => value + 1,
        foo: 1,
      });
      const element = render(
        '<test-angular-two foo="foo" bar="bar" baz="baz"><span>Transcluded</span></test-angular-two>',
      );
      expect(element.find('span').length).toBe(0);
    });

    it('should not call render after component unmount', () => {
      const callorder: string[] = [];
      const componentWillUnmountSpy = jest.fn(() => {
        callorder.push('componentWillUnmount');
      });
      const renderSpy = jest.fn(() => {
        callorder.push('render');
      });

      useScope({
        onComponentWillUnmount: componentWillUnmountSpy,
        onRender: renderSpy,
        values: ['val1'],
      });
      const element = render(`
        <test-angular-eight-wrapper
          on-render="onRender"
          on-component-will-unmount="onComponentWillUnmount"
          values="values">
        </test-angular-eight-wrapper>
      `);

      const childScope = angular.element(element.find('test-angular-eight')).scope();
      $rootScope.$apply();

      // Erase first render caused on apply
      expect(renderSpy).toHaveBeenCalled();
      renderSpy.mockReset();

      // Destroy child component to cause unmount
      act(() => {
        childScope.$destroy();
      });

      expect(componentWillUnmountSpy).toHaveBeenCalledTimes(1);
      expect(renderSpy).not.toHaveBeenCalled();
      expect(callorder).toEqual(['render', 'componentWillUnmount']);
    });
  });
});
