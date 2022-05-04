import {
EyeInvisibleOutlined, EyeTwoTone
} from '@ant-design/icons';

import { gql, useMutation, useQuery } from '@apollo/client';
import { Divider,
Input,
Layout,
Button,
Space,
notification,
Statistic} from 'antd';
import Header1 from "../../core/Header1";
import React, { useEffect, useState } from 'react';
import {useUser} from '../../core/functions';

const { Sider, Content} = Layout;

//конфигуратор запросов graphql

const updateUserPassword = gql`
  mutation updatePassword(
    $username: String
    $password: String
  ) {
    updatePassword(username: $username, password: $password) {
	  username
      password
	  
    }
  }
`;

const versionCheck = gql`
	query application($application: JSON){
  application(application: $application){
    platform_version,
    database_version
  }
}`; 

let Account = React.memo((props) => {
	const [password, setPassword] = useState();
	const [password2, setPassword2] = useState();
	const [oldpassword, setOldPassword] = useState("1447");
	const [load, setLoad] = useState();
	
	const getUser = useUser();
	const username=getUser.username;	

    const [dataPassword, { loading:loadingMutation, error:errorMutation }] = useMutation(updateUserPassword, {
		onCompleted: (data) => console.log("Data from mutation", data),
		onError: (error) => console.error("Error creating a post", error)
	});
	
	const { loading, data:versionData, refetch } = useQuery(versionCheck);

	        useEffect(() => {
            if (!loadingMutation) {
                if (errorMutation) {
                    notification['error']({ message: (error) => error, duration: 0, placement: 'topLeft'  })
                }
            }
        }, [errorMutation]);
		
		useEffect(() => {
            if (!loadingMutation) {
                if (load==="0") {
                    notification['info']({ message: "Пароль изменён", duration: 0, placement: 'topLeft'  });
					setLoad("1");
					console.log(load);
                }
            }
        }, [(data)=>data,load]);
	
  
  	let handlerPasswordChange = () => {
		if (password===password2 && password.length>0 && password2.length>0) {
			setLoad("0");
    dataPassword({ variables: { username,password} });
		}
		else {
		notification['error']({ message: "Пароли не совпадают или не введены", duration: 0, placement: 'topLeft'  })
		}
  }
  
   	let handlerInput1 = (e) => {
    setPassword(e.target.value);
	console.log(password)
  }
  
   	let handlerInput2 = (e) => {
	setPassword2(e.target.value)
	console.log(password2)
  }
  
    let handlerInput3 = (e) => {
	setOldPassword(e.target.value)
	console.log(oldpassword)
  }
  
    return (
			<>
            <Layout>
                <Header1 title={'Аккаунт'} user={getUser}/>
                <Layout>
                    <Sider theme="dark" style={{color:"#fff"}}
                    >
                        <Divider style={{margin: '0 0 7px 0', top: 0}}/>
						<h1 style={{color:"#fff"}}>Настройки аккаунта</h1>
						<Statistic title="Версия платформы" value={(versionData && versionData.application && versionData.application[0]!=null) ? versionData.application[0].platform_version :null}/>
						<Statistic title="Версия БД" value={(versionData && versionData.application && versionData.application[0]!=null) ? versionData.application[0].database_version :null}/>
						</Sider>
						<Content>
						<Space direction="vertical">	
						<h1> Функция смены пароля </h1>					 
						<h1> Введите новый пароль 2 раза </h1>					 
							<Input.Password placeholder="Введите новый пароль" value={password} onChange={handlerInput1} className="accountInput" iconRender={visible => (visible ? <EyeTwoTone className='accountEyeTwoTone' style={{color:"#2C3E50" }}/> : <EyeInvisibleOutlined className='accountEyeTwoTone' style={{color:"#2C3E50" }}/>)}/>
							<Input.Password onChange={handlerInput2} value={password2}
							  placeholder="Введите новый пароль"
							  iconRender={visible => (visible ? <EyeTwoTone className='accountEyeTwoTone' style={{color:"#2C3E50" }}/> : <EyeInvisibleOutlined className='accountEyeTwoTone' style={{color:"#2C3E50" }}/>)}
							  className="accountInput"
							/>
							<Button onClick={handlerPasswordChange}>Сменить пароль</Button>
						  </Space>
					   
                    </Content>
                </Layout>
            </Layout>
        </>
	)
});


export default Account;