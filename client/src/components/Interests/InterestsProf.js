import { List, Typography, Divider } from 'antd';
import { NavLink } from 'react-router-dom/cjs/react-router-dom.min';

let InterestsProf = (props) => {
    return (
        <List
            size="large"
            header={<div><Typography.Text strong>Профессии, которые вас могут заинтересовать</Typography.Text></div>}
            // footer={<div>Footer</div>}
            bordered
            dataSource={props.prof_data}
            renderItem={item => <List.Item> <NavLink to="/study-page">{item}</NavLink></List.Item>}
        />
    )
}

export default InterestsProf