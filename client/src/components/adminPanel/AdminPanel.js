import {
    TeamOutlined
} from '@ant-design/icons';
import { Divider, Layout, Menu } from 'antd';
import React from 'react';
import { NavLink, Redirect, Route, useLocation, withRouter } from 'react-router-dom';
import UsersPage from './pages/UsersPage';
import DocumentStatusesPage from './pages/DocumentStatusesPage';
import DocumentRoutesPage from './pages/DocumentRoutesPage';
import DocumentPositionsPage from './pages/PositionsPage';
import { accessRedirect, useUser } from "../../core/functions";
import Header1 from "../../core/Header1";



const { Header, Content, Footer, Sider } = Layout;
//const [
//    ttt,
//    { loading: mutationLoading, error: mutationError, data },
//] = useMutation(GET_GREETING);
//useEffect(() => {
//    ttt();
//}, []);
//console.log(mutationLoading);
//console.log(mutationError);
//console.log(data);

let AdminPanel = (props) => {
    let { pathname } = useLocation();
    let user = useUser();

    let path = props.location.pathname.split('/').slice(1);
    if (pathname === '/admin/' || pathname === '/admin') {
        if (user.username) {
            return <Redirect to='/admin/registration' />;
        }
        if (user.username) {
            return <Redirect to='/admin/positions-page' />;
        }
        if (user.username) {
            return <Redirect to='/admin/document-statuses-page' />;
        }
        if (user.username) {
            return <Redirect to='/admin/document-routes-page' />;
        }
    }
    console.log(path, pathname);

    return (
        <Layout className="main-layout">
            <Header1 title={'Карточка обучающегося'} user={user} />
            <Layout>

                <Layout className="content-layout">
                    <Content
                        style={{
                            padding: 24,
                            margin: 0,
                            // minHeight: 280
                        }}>
                        <div className="site-layout-background" style={{ minHeight: 360 }}>
                            <Route path="/admin/registration" component={UsersPage} />
                            {/* <Route path="/admin/positions-page" component={DocumentPositionsPage} />
                            <Route path="/admin/document-statuses-page" component={DocumentStatusesPage} />
                            <Route path="/admin/document-routes-page" component={DocumentRoutesPage} /> */}
                        </div>
                    </Content>
                </Layout>
            </Layout>
        </Layout>
    )
}

export default withRouter(AdminPanel);