import React from 'react';
import 'antd/dist/antd.css';
import ReactDOM from 'react-dom';
import './index.css';

import constants from "./config/constants";

import { ApolloProvider } from '@apollo/client';
import { ApolloClient, InMemoryCache } from '@apollo/client';
import {
	DesktopOutlined,
	BarChartOutlined,
	DatabaseOutlined,
	ClockCircleOutlined
} from '@ant-design/icons';
import { ApolloLink } from '@apollo/client';
import { onError } from "@apollo/client/link/error";

import { split, HttpLink } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { WebSocketLink } from '@apollo/client/link/ws';
import { setContext } from '@apollo/client/link/context';

import { ConfigProvider, Layout, Row, notification, Button, Tooltip, Col } from 'antd';
import ru_RU from 'antd/lib/locale/ru_RU';
import { Route, Redirect, Switch, BrowserRouter, useLocation, NavLink } from 'react-router-dom';
import { accessRedirect, useUser } from "./core/functions";
import Header1 from "./core/Header1";
import Error404 from "./modules/Error404";
import Login from './modules/Login';
import AdminPanel from "./components/adminPanel/AdminPanel";
import Account from "./components/account/Account";
import StudyPage from './components/DocumentControl/StudyPage';
import InterestsPage from './components/Interests/InterestsPage';


let { host, port, graphql } = constants;
let host1;

console.log("Starting SD Client. Host is " + window.SERVER_DATA);

// настройка Apollo Client
//// для запросов
const httpLink = new HttpLink({
	uri: `https://` + window.SERVER_DATA + `:${port}${graphql.path}`
});
//// для подписок
const wsLink = new WebSocketLink({
	uri: `wss://` + window.SERVER_DATA + `:${port}${graphql.path}`,
	options: {
		reconnect: true
	}
});
const { Header, Content, Sider } = Layout;
// errors of above
const errorLink = onError(({ graphQLErrors, networkError }) => {
	if (graphQLErrors)
		graphQLErrors.map(({ message, locations, path }) => {
			console.log(
				`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
			)
			console.log("LOCATION", locations)
		}


		);

	if (networkError) {
		console.log(`[Network error]: ${JSON.stringify(networkError)}`);
		notification['info']({
			message: <div id="ant_notification">Ошибка соединения с сервером IUPC-WEB.<br />Обновите страницу. Если проблема не устранилась через 5 минут, свяжитесь с вашей службой IT.</div>,
			duration: 10, placement: 'bottomRight'
		})
	}
});

//// добавдение данных в заголовок запроса(POST)
const authLink = setContext((_, { headers }) => {
	// get the authentication token from local storage if it exists
	const token = localStorage.getItem('token');
	// return the headers to the context so httpLink can read them
	return {
		headers: {
			...headers,
			authorization: token ? `Bearer ${token}` : "",
		}
	}
});
//// объединение вышеперечисленного
const splitLink = split(
	({ query }) => {
		const definition = getMainDefinition(query);
		return (
			definition.kind === 'OperationDefinition' &&
			definition.operation === 'subscription'
		);
	},
	wsLink,
	authLink.concat(httpLink),
);
// инициализация клиента
const client = new ApolloClient({
	link: ApolloLink.from([errorLink, splitLink]),
	cache: new InMemoryCache()
});




const StudyPageP =
	<Col className='main-menu-col'>
		<Tooltip placement="rightTop" title="">
			<Button type='solid' className="main-menu-button"><NavLink to="study-page" style={{ fontSize: "25px" }}> <DesktopOutlined style={{ marginRight: 7 }} /> Обучение <p className='page-desc'>Информация об учебных <br/>заведений и их приемных <br/>кампаниях</p></NavLink></Button>
		</Tooltip>
	</Col>
const InterestsPageP =
	<Col className='main-menu-col'>
		<Tooltip placement="rightTop" title="">
			<Button type='solid' className="main-menu-button"><NavLink to="interests-page" style={{ fontSize: "25px" }}> <BarChartOutlined style={{ marginRight: 7 }} /> Интересы <p className='page-desc'>Здесь вы можете пройти <br/>тестирование на профориентацию, <br/>указать свои интересы <br/>и многое другое</p></NavLink></Button>
		</Tooltip>
	</Col>
const documentHistoryP =
	<Col className='main-menu-col'>
		<Tooltip placement="rightTop" title="">
			<Button type='solid' className="main-menu-button"><NavLink to="document-history" style={{ fontSize: "25px" }}> <ClockCircleOutlined style={{ marginRight: 7 }} />  Рекомендации <p className='page-desc'>В данной разделе вы найдете <br/>рекомендации по выбору учебных <br/>заведений на основе выших <br/>интересов и учебных достижений</p></NavLink></Button>
		</Tooltip>
	</Col>
const documentSearchP =
	<Col className='main-menu-col'>
		<Tooltip placement="rightTop" title="">
			<Button type='solid' className="main-menu-button"><NavLink to="document-search" style={{ fontSize: "25px" }}><DatabaseOutlined style={{ marginRight: 7 }} /> Поиск <p className='page-desc'>Поиск по ...</p></NavLink></Button>
		</Tooltip>
	</Col>



let StartPage = React.memo(() => {
	let { pathname } = useLocation();
	const user = useUser();
	console.log('user', user)
	return (
		<Layout>
			<Header1 title={''} user={user} />
			<Layout>
				{/* <SiderMenu /> */}
				<Layout className="content-layout">
					<Content className="site-layout-background"
						style={{
							padding: 0,
							margin: 0,
							minHeight: 280
						}}>
						<div style={{ paddingTop: 50 }}>
							<Row justify='center' style={{ margin: "0", top: "50%", transform: "translate(0,-50%)", position: "absolute", width: "99%" }}>

								{StudyPageP}

								{InterestsPageP}

								{documentHistoryP}

								{documentSearchP}

							</Row>
						</div>
						
					</Content>
				</Layout>
			</Layout>
		</Layout>
	)
})

let App = () => {
	let { pathname } = useLocation();
	const user = useUser();

	return (
		<Switch>
			<Route path="/login" component={Login} />
			<Route path="/logout" component={() => { return <></> }} />
			<Route path="/" exact component={StartPage} />
			<Route path="/study-page" component={StudyPage} />
			<Route path="/interests-page" component={InterestsPage} />
			<Route path={"/admin"} component={accessRedirect(AdminPanel)}></Route>
			<Route path="/account" component={accessRedirect(Account)} />

			<Route component={Error404} />
		</Switch>
	)
};

ReactDOM.render(
	<BrowserRouter>
		<ApolloProvider client={client}>
			<ConfigProvider locale={ru_RU}>
				<App />
			</ConfigProvider>
		</ApolloProvider>
	</BrowserRouter>, document.getElementById('root'))