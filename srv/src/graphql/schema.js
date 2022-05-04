const { gql } = require('apollo-server-express');

let typeDefs = gql`
    scalar JSON
    scalar Bigint
    scalar DateTime
    type Status {
        type: String
        message: String
    }

    type Role {
        id: ID
        name: String
    }

    type User {
        id: ID
        username: String
        password: String
        admin: Boolean
        role_id: Bigint
        accesses: JSON
        positions: JSON
        position_names: JSON
        domain_username: String
        fio: String
    }

    type Position {
        id: ID
        name: String
        accesses: JSON
    }
	type Application {
        platform_version: String
        database_version: String
    }
    type Session {
        sid: String!
        sess: String
        expire: DateTime
    }
    type Test {
        one: Int
        two: Int
        test1: Test1
    }
    type Test1 {
        one: Int
        two: Int
        test2: Test2
    }
    type Test2 {
        one: Int
        two: Int
    }
    type Test3 {
        id: Bigint
        routes: String
    }

    type Agreement {
        document_id: Bigint
        document_user: Bigint
    }

    type DocumentStatuses {
        id: ID
        name: String
    }
    type DocumentRoutes{
        id: ID
        name: String
        status_in_process: Bigint
        status_cancelled: Bigint
        status_finished: Bigint
        routes: JSON
    }
    type Documents {
        id: ID
        title: String
        reason: String
        subject: String
        supllier: String
        description: String
        status_id: Bigint
        document_statuses: DocumentStatuses
        route_id: DocumentRoutes
        user_id: Bigint
        username:String
        position:String
        fio:String
        date_created: DateTime
        date_modified: DateTime
        step: Bigint
        prise: Bigint
        is_read: Boolean
        comments: [Comments]
        signatures:[Signatures]
        files:[Files]
    }

    type Data_one{
        id:ID
        document_id: Documents
        title:String
        description: String
        price: Int
        supllier: String
        subject: String
        reason: String
    }

    type Comments {
        id: ID
        comment: String
        document_id: Bigint
        user_id: Bigint
        username:String
        position:String
        fio:String
        date: DateTime
    }

    type Signatures {
        id: ID
        document_id: Bigint
        user_id: Bigint
        username:String
        position:String
        fio:String
        date_signature: String
    }
    

    type Files {
        id: ID
        filename: String
        data_file: String
        document_id: Bigint
    }

    # generated automatically
    type Query {
        test: [Test]
        test1: Test1
        test2: Test2
        test3: Test3
        authMe(test: JSON): [User]
        dateTime: DateTime
        users(users: JSON): [User]
        positions(positions: JSON): [Position]
        user_roles(user_roles: JSON): [Role]
        sessions(sessions: JSON): [Session]
        documents(documents: JSON): [Documents]
        document_comments(document_comments:JSON): [Comments]
        document_signatures(document_signatures:JSON): [Signatures]
        files(files:JSON): [Files]
        document_statuses(document_statuses: JSON): [DocumentStatuses]
        document_routes(document_routes: JSON) : [DocumentRoutes]
    }
    type Mutation {
        login(user: JSON): User

        insertUser(user: JSON): Status
        updateUser(user: JSON): Status
        deleteUser(user: JSON): Status

        updatePassword(username:String, password:String): User

        insertDocument(document: JSON) : Status
        updateDocument(document: JSON) : Status
        deleteDocument(document: JSON) : Status

        setIsReadTrue(document: JSON) : Status

        insertComment(comment: JSON) : Status
        updateComment(comment: JSON) : Status
        deleteComment(comment: JSON) : Status

        insertSignature(signature: JSON) : Status
        updateSignature(signature: JSON) : Status
        deleteSignature(signature: JSON) : Status

        setAgreement(agreement: JSON) : Status

        updateDocumentStatusId(documents: JSON) : Status

        insertDocumentStatus(document_statuses: JSON) : Status
        updateDocumentStatus(document_statuses: JSON) : Status
        deleteDocumentStatus(document_statuses: JSON) : Status

        insertDocumentRoute(document_routes: JSON) : Status
        updateDocumentRoute(document_routes: JSON) : Status
        deleteDocumentRoute(document_routes: JSON) : Status

        insertPosition(positions: JSON) : Status
        updatePosition(positions: JSON) : Status
        deletePosition(positions: JSON) : Status

    }
    type Subscription {
        authMe(test: JSON): [User]
        users(users: JSON): [User]
        positions(positions: JSON): [Position]
        sessions(sessions: JSON): [Session]
        documents(documents: JSON): [Documents]

        document_comments(document_comments:JSON): [Comments]
        document_signatures(document_signatures:JSON): [Signatures]
        document_statuses(document_statuses: JSON): [DocumentStatuses]
        document_routes(document_routes: JSON) : [DocumentRoutes]

    }
`;

module.exports = typeDefs;
