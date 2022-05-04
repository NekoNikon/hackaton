import {
    CrownOutlined,
    LogoutOutlined,
    ArrowLeftOutlined, UserOutlined, ReadOutlined
} from '@ant-design/icons';
import 'antd/dist/antd.css';
import {Grid,Dropdown,Menu, Col, Layout, Row, Space, PageHeader, Avatar} from "antd";
import React from "react";
import { useHistory, useLocation} from "react-router-dom";
import notification from "./img/notification.png"

const { Header } = Layout;
const { useBreakpoint } = Grid;

let Header1 = React.memo(({title, user, ...props})=>{
    const screens = useBreakpoint();
    let history = useHistory();
    //let [visible, setVisible] = useState(false);
    let {pathname} =  useLocation();
    //console.log(screens);
    return <div>
        <Header className="site-layout-sub-header-background" style={{ padding: 0 }}>
            <Row justify="space-between" align="middle" style={{ paddingLeft: 46 }}>
                <Col flex="auto" style={{color: "c40c46"}}>
                        <PageHeader
                            className="site-page-header"
                             // onBack={() => null}
                        backIcon={<ArrowLeftOutlined style={{ color: "white" }} />}
                            onBack = {pathname === '/' ? null : ()=>{history.push('/')}}
                            title={<div style={{color: "white"}}>Согласование договоров</div>}

                            // subTitle="This is a subtitle"
                        />
                </Col>
                {screens.sm?<Col flex="auto">
                    <h1 style={{color: 'white'}}>{title}</h1>
                </Col>:<></>}

                <Col><img src={notification} style={{width:"25px", marginRight:"25px"}}/></Col>
                <Col><Avatar shape="square" size="small" icon={<UserOutlined />} /></Col>


                <Col flex="70px" style={{marginRight:"30px"}}>
                    <Space direction="vertical" align="center" style={{ width: '100%'}}>

                        {/*<Button type="primary"><a href="/logout">Выйти</a></Button>*/}
                        <Dropdown overlay={<Menu>
                            {user.admin &&
                            <Menu.Item danger onClick={()=>{history.push('/admin/')}} style={{textAlign:'center'}}>
                                <CrownOutlined />ADMIN
                            </Menu.Item> }

							{user.admin && <Menu.Item danger onClick={()=>{

								let a= document.createElement('a');
								a.target= '_blank';
								a.title= 'IUPC-WEB';
								a.href= '/help/admin';
								a.click();
							}} style={{textAlign:'center'}}><ReadOutlined />Справка</Menu.Item> }

							{user.technicalDepartment && !user.admin && <Menu.Item danger onClick={()=>{

								let a= document.createElement('a');
								a.target= '_blank';
								a.title= 'ZIK-СКУД';
								a.href= '/help/hr';
								a.click();
							}} style={{textAlign:'center'}}><ReadOutlined />Справка</Menu.Item>}

							<Menu.Item danger onClick={()=>{window.location.href = '/account/'}} style={{textAlign:'center'}}><UserOutlined />Аккаунт</Menu.Item>
                            <Menu.Item danger onClick={()=>{window.location.href = '/logout/'}} style={{textAlign:'center'}}><LogoutOutlined />Выйти</Menu.Item>
                        </Menu>} placement="bottomCenter" trigger={['click']}>
                            <a className="ant-dropdown-link" onClick={e => e.preventDefault()} style={{fontSize:21}}>
                                {user.username}
                            </a>
                        </Dropdown>
                    </Space>
                </Col>
            </Row>

        </Header>
    </div>
});

export default Header1;