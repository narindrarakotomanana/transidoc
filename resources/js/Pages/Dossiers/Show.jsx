import React, { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import {Card,Typography,Descriptions,Table,Tag,Button,
Space,Empty,Breadcrumb,message,Upload,Select,Modal,Alert,
} from 'antd';

import {ArrowLeftOutlined,FileTextOutlined,DownloadOutlined,FolderOpenOutlined,PlusOutlined,InboxOutlined,DeleteOutlined,
} from '@ant-design/icons';

import AuthenticatedLayout from '../../Layouts/AuthenticatedLayout';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const TYPES_DOCUMENTS = [
    'Reçu',
    'Facture',
    'Attestation',
    'BL',
    'Bon de sortie',
    'Déclaration',
    'Valeur MIDAC',
    'Carte grise',
    'Modèle',
    'À identifier',
    'Autre',
];

function detectDocumentType(filename) {
    const name = filename
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    if (name.includes('facture')) return 'Facture';
    if (name.includes('recu')) return 'Reçu';
    if (name.includes('attestation')) return 'Attestation';

    if (
        name.includes('bl') ||
        name.includes('bill') ||
        name.includes('lading')
    ) {
        return 'BL';
    }

    if (name.includes('sortie')) return 'Bon de sortie';

    if (name.includes('declaration')) return 'Déclaration';

    if (name.includes('midac')) return 'Valeur MIDAC';

    if (name.includes('carte') || name.includes('grise')) {
        return 'Carte grise';
    }

    if (name.includes('modele')) return 'Modèle';

    return 'À identifier';
}

function formaterDate(date) {
    if (!date) return '—';

    const parsedDate = new Date(`${date}T00:00:00`);

    return new Intl.DateTimeFormat('fr-FR').format(parsedDate);
}

function formaterDateImportation(date) {
if (!date) return '—';

const parsedDate = new Date(date.replace(' ', 'T'));

return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
}).format(parsedDate);

}

function formaterTaille(taille) {
    if (taille < 1024) return `${taille} octets`;
    if (taille < 1024 * 1024) return `${(taille / 1024).toFixed(1)} Ko`;

    return `${(taille / (1024 * 1024)).toFixed(1)} Mo`;

}

export default function Show({ dossier }) {
    const [messageApi, contextHolder] = message.useMessage();
    const [modalOuvert, setModalOuvert] = useState(false);

    const {
        data,
        setData,
        post,
        processing,
        errors,
        reset,
        clearErrors,
    } = useForm({
        documents: [],
    });

    const ouvrirDocument = (chemin) => {
        if (!chemin) {
            messageApi.warning('Le chemin du document est indisponible.');
            return;
        }

        window.open(
            `/storage/${chemin.replace(/^\/+/, '')}`,
            '_blank',
            'noopener,noreferrer'
        );
    };

    const ajouterFichiers = (fileList) => {
        const nouveauxDocuments = fileList.map((file) => ({
            key: `${file.uid}`,
            file,
            type: detectDocumentType(file.name),
        }));

        setData('documents', [...data.documents, ...nouveauxDocuments]);
        clearErrors();
    };

    const modifierType = (key, type) => {
        setData(
            'documents',
            data.documents.map((document) =>
                document.key === key ? { ...document, type } : document
            )
        );
    };

    const retirerFichier = (key) => {
        setData(
            'documents',
            data.documents.filter((document) => document.key !== key)
        );
    };

    const fermerModal = () => {
        if (processing) return;

        setModalOuvert(false);
        reset();
        clearErrors();
    };

    const envoyerDocuments = () => {
        if (data.documents.length === 0) {
            messageApi.warning('Sélectionnez au moins un fichier.');
            return;
        }

        clearErrors();

        post(`/dossiers/${dossier.id}/documents`, {
            forceFormData: true,

            onSuccess: () => {
                setModalOuvert(false);
                reset();
                messageApi.success('Les documents ont été ajoutés avec succès.');
            },

            onError: () => {
                messageApi.error(
                    "Impossible d'ajouter les documents. Vérifiez les fichiers sélectionnés."
                );
            },
        });
    };

    const colonnes = [
        {
            title: 'Type de document',
            dataIndex: 'type',
            key: 'type',
            width: 180,
            render: (type) => (
                <Tag color="blue">{type || 'À identifier'}</Tag>
            ),
        },
        {
            title: 'Nom du fichier',
            dataIndex: 'nom_original',
            key: 'nom_original',
            render: (nom) => (
                <Space>
                    <FileTextOutlined />
                    <Text>{nom || 'Fichier sans nom'}</Text>
                </Space>
            ),
        },
        {
            title: "Date d'ajout",
            dataIndex: 'date_ajout',
            key: 'date_ajout',
            width: 150,
            render: (date) => formaterDateImportation(date),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 130,
            render: (_, document) => (
                <Button
                    size="small"
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={() => ouvrirDocument(document.chemin)}
                >
                    Ouvrir
                </Button>
            ),
        },
    ];

    const colonnesNouveauxFichiers = [
        {
            title: 'Nom du fichier',
            key: 'nom',
            render: (_, document) => (
                <Space>
                    <FileTextOutlined />
                    <div>
                        <Text>{document.file.name}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {formaterTaille(document.file.size)}
                        </Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Catégorie',
            key: 'type',
            width: 220,
            render: (_, document) => (
                <Select
                    value={document.type}
                    style={{ width: '100%' }}
                    options={TYPES_DOCUMENTS.map((type) => ({
                        label: type,
                        value: type,
                    }))}
                    onChange={(type) => modifierType(document.key, type)}
                />
            ),
        },
        {
            title: 'Action',
            key: 'action',
            width: 90,
            render: (_, document) => (
                <Button
                    danger
                    type="text"
                    icon={<DeleteOutlined />}
                    aria-label={`Retirer ${document.file.name}`}
                    onClick={() => retirerFichier(document.key)}
                />
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            {contextHolder}

            <Space
                direction="vertical"
                size="large"
                style={{ width: '100%' }}
            >
                <Breadcrumb
                    items={[
                        {
                            title: (
                                <a onClick={() => router.visit('/dossiers')}>
                                    Dossiers
                                </a>
                            ),
                        },
                        {
                            title: 'Consultation du dossier',
                        },
                    ]}
                />

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 12,
                    }}
                >
                    <div>
                        <Title level={4} style={{ margin: 0 }}>
                            Dossier {dossier.numero_bl || `#${dossier.id}`}
                        </Title>

                        <Text type="secondary">
                            Consultez les informations et les documents associés.
                        </Text>
                    </div>

                    <Space wrap>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setModalOuvert(true)}
                        >
                            Ajouter des documents
                        </Button>

                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={() => router.visit('/dossiers')}
                        >
                            Retour aux dossiers
                        </Button>
                    </Space>
                </div>

                <Card
                    title={
                        <Space>
                            <FolderOpenOutlined />
                            Informations du dossier
                        </Space>
                    }
                >
                    <Descriptions bordered column={{ xs: 1, sm: 2, lg: 2 }}>
                        <Descriptions.Item label="Numéro BL">
                            {dossier.numero_bl || '—'}
                        </Descriptions.Item>

                        <Descriptions.Item label="Date du dossier">
                            {formaterDate(dossier.date_dossier)}
                        </Descriptions.Item>

                        <Descriptions.Item label="Client">
                            {dossier.client || '—'}
                        </Descriptions.Item>

                        <Descriptions.Item label="Navire">
                            {dossier.navire || '—'}
                        </Descriptions.Item>

                        <Descriptions.Item label="Date d'importation">
                            {formaterDateImportation(dossier.date_importation)}
                        </Descriptions.Item>

                        <Descriptions.Item label="Nombre de documents">
                            {dossier.documents?.length ?? 0}
                        </Descriptions.Item>
                    </Descriptions>
                </Card>

                <Card
                    title="Documents du dossier"
                    extra={
                        <Tag color="blue">
                            {dossier.documents?.length ?? 0} document(s)
                        </Tag>
                    }
                >
                    <Table
                        rowKey="id"
                        size="middle"
                        columns={colonnes}
                        dataSource={dossier.documents ?? []}
                        scroll={{ x: 700 }}
                        locale={{
                            emptyText: (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description="Aucun document dans ce dossier"
                                />
                            ),
                        }}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: false,
                            showTotal: (total) => `${total} document(s)`,
                        }}
                    />
                </Card>
            </Space>

            <Modal
                title="Ajouter des documents au dossier"
                open={modalOuvert}
                onCancel={fermerModal}
                width={850}
                destroyOnHidden
                footer={[
                    <Button
                        key="annuler"
                        onClick={fermerModal}
                        disabled={processing}
                    >
                        Annuler
                    </Button>,
                    <Button
                        key="envoyer"
                        type="primary"
                        icon={<PlusOutlined />}
                        loading={processing}
                        onClick={envoyerDocuments}
                        disabled={data.documents.length === 0}
                    >
                        Enregistrer les documents
                    </Button>,
                ]}
            >
                <Space
                    direction="vertical"
                    size="middle"
                    style={{ width: '100%' }}
                >
                    <Alert
                        type="info"
                        showIcon
                        message={`Dossier ${dossier.numero_bl || `#${dossier.id}`}`}
                        description="Les documents seront ajoutés à ce dossier. Les documents déjà présents seront conservés."
                    />

                    <Dragger
                        multiple
                        accept="*"
                        beforeUpload={(file) => {
                            ajouterFichiers([file]);
                            return Upload.LIST_IGNORE;
                        }}
                        showUploadList={false}
                        disabled={processing}
                    >
                        <p className="ant-upload-drag-icon">
                            <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">
                            Cliquez ou déposez vos fichiers ici
                        </p>
                        <p className="ant-upload-hint">
                            Vous pouvez sélectionner plusieurs fichiers.
                            Chaque fichier peut peser jusqu'à 50 Mo.
                        </p>
                    </Dragger>

                    {errors.documents && (
                        <Alert
                            type="error"
                            showIcon
                            message={errors.documents}
                        />
                    )}

                    {Object.entries(errors)
                        .filter(([key]) => key.startsWith('documents.'))
                        .map(([key, error]) => (
                            <Alert
                                key={key}
                                type="error"
                                showIcon
                                message={error}
                            />
                        ))}

                    <div>
                        <Text strong>
                            Fichiers sélectionnés : {data.documents.length}
                        </Text>

                        {data.documents.length > 0 && (
                            <Table
                                style={{ marginTop: 12 }}
                                rowKey="key"
                                size="small"
                                pagination={false}
                                scroll={{ x: 600 }}
                                columns={colonnesNouveauxFichiers}
                                dataSource={data.documents}
                            />
                        )}
                    </div>
                </Space>
            </Modal>
        </AuthenticatedLayout>
    );
}