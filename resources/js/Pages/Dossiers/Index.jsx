import React from 'react';
import { router } from '@inertiajs/react';
import {
    Card,
    Typography,
    Table,
    Input,
    Select,
    Space,
    Button,
    Row,
    Col,
    Empty,
    Modal,
    Descriptions,
    Tag,
} from 'antd';

import {
    SearchOutlined,
    ClearOutlined,
    FolderOpenOutlined,
    InfoCircleOutlined,
    PlusOutlined,
} from '@ant-design/icons';

import AuthenticatedLayout from '../../Layouts/AuthenticatedLayout';

const { Title, Text } = Typography;

const moisOptions = [
    { value: '1', label: 'Janvier' },
    { value: '2', label: 'Février' },
    { value: '3', label: 'Mars' },
    { value: '4', label: 'Avril' },
    { value: '5', label: 'Mai' },
    { value: '6', label: 'Juin' },
    { value: '7', label: 'Juillet' },
    { value: '8', label: 'Août' },
    { value: '9', label: 'Septembre' },
    { value: '10', label: 'Octobre' },
    { value: '11', label: 'Novembre' },
    { value: '12', label: 'Décembre' },
];

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

export default function Index({ dossiers, filters = {} }) {
    const [search, setSearch] = React.useState(filters.search ?? '');
    const [annee, setAnnee] = React.useState(filters.annee ?? '');
    const [mois, setMois] = React.useState(filters.mois ?? '');
    const [dossierSelectionne, setDossierSelectionne] =
        React.useState(null);

    const premiereRecherche = React.useRef(true);

    // Préparer les paramètres de recherche.
    const construireParametres = (overrides = {}) => {
        const valeurs = {
            search,
            annee,
            mois,
            ...overrides,
        };

        const params = {};

        Object.entries(valeurs).forEach(([key, value]) => {
            if (value !== '' && value !== null && value !== undefined) {
                params[key] = value;
            }
        });

        return params;
    };

    // Appliquer les filtres et revenir à la première page.
    const appliquerFiltres = (overrides = {}) => {
        router.get(
            '/dossiers',
            construireParametres(overrides),
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    };

    // Recherche automatique après une courte pause de saisie.
    React.useEffect(() => {
        if (premiereRecherche.current) {
            premiereRecherche.current = false;
            return;
        }

        const timer = setTimeout(() => {
            appliquerFiltres({ search });
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);

    const reinitialiserFiltres = () => {
        setSearch('');
        setAnnee('');
        setMois('');

        router.get('/dossiers', {}, {
            preserveState: false,
            preserveScroll: true,
            replace: true,
        });
    };

    const anneesDisponibles = React.useMemo(() => {
        const anneeActuelle = new Date().getFullYear();

        return Array.from(
            { length: anneeActuelle - 1999 },
            (_, index) => anneeActuelle - index
        ).map((anneeOption) => ({
            value: String(anneeOption),
            label: String(anneeOption),
        }));
    }, []);

    const colonnes = [
        {
            title: 'Date',
            dataIndex: 'date_dossier',
            key: 'date_dossier',
            width: 120,
            render: (date) => formaterDate(date),
            sorter: (a, b) =>
                (a.date_dossier ?? '').localeCompare(
                    b.date_dossier ?? ''
                ),
        },
        {
            title: 'Numéro BL',
            dataIndex: 'numero_bl',
            key: 'numero_bl',
            width: 160,
            render: (numero) => (
                <Text strong>{numero || '—'}</Text>
            ),
        },
        {
            title: 'Client',
            dataIndex: 'client',
            key: 'client',
            ellipsis: true,
            render: (client) => client || '—',
        },
        {
            title: 'Navire',
            dataIndex: 'navire',
            key: 'navire',
            ellipsis: true,
            render: (navire) => navire || '—',
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 190,
            render: (_, dossier) => (
                <Space size="small">
                    <Button
                        size="small"
                        icon={<InfoCircleOutlined />}
                        onClick={() => setDossierSelectionne(dossier)}
                    >
                        Détails
                    </Button>

                    <Button
                        size="small"
                        type="primary"
                        icon={<FolderOpenOutlined />}
                        onClick={() => {
                            router.visit(`/dossiers/${dossier.id}`);
                        }}
                    >
                        Ouvrir
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <Space
                direction="vertical"
                size="middle"
                style={{ width: '100%' }}
            >
                {/* En-tête de la page */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 16,
                    }}
                >
                    <div>
                        <Title level={4} style={{ margin: 0 }}>
                            Dossiers
                        </Title>

                        <Text type="secondary">
                            Retrouvez et consultez vos dossiers.
                        </Text>
                    </div>

                    <Button
                        type="primary"
                        size="large"
                        icon={<PlusOutlined />}
                        onClick={() => router.visit('/importer-dossier')}
                    >
                        Importer un dossier
                    </Button>
                </div>

                {/* Recherche et filtres */}
                <Card
                    size="small"
                    styles={{
                        body: {
                            padding: 12,
                        },
                    }}
                >
                    <Row gutter={[8, 8]} align="middle">
                        <Col xs={24} md={12} lg={12}>
                            <Input
                                size="middle"
                                placeholder="Rechercher un BL, un client ou un navire..."
                                prefix={<SearchOutlined />}
                                value={search}
                                allowClear
                                onChange={(event) => {
                                    setSearch(event.target.value);
                                }}
                            />
                        </Col>

                        <Col xs={12} md={5} lg={4}>
                            <Select
                                size="middle"
                                placeholder="Année"
                                allowClear
                                style={{ width: '100%' }}
                                value={annee || undefined}
                                options={anneesDisponibles}
                                onChange={(value) => {
                                    const nouvelleAnnee = value ?? '';

                                    setAnnee(nouvelleAnnee);

                                    appliquerFiltres({
                                        annee: nouvelleAnnee,
                                    });
                                }}
                            />
                        </Col>

                        <Col xs={12} md={5} lg={4}>
                            <Select
                                size="middle"
                                placeholder="Mois"
                                allowClear
                                style={{ width: '100%' }}
                                value={mois || undefined}
                                options={moisOptions}
                                onChange={(value) => {
                                    const nouveauMois = value ?? '';

                                    setMois(nouveauMois);

                                    appliquerFiltres({
                                        mois: nouveauMois,
                                    });
                                }}
                            />
                        </Col>

                        <Col xs={24} md={2} lg={4}>
                            <Button
                                size="middle"
                                icon={<ClearOutlined />}
                                onClick={reinitialiserFiltres}
                                block
                            >
                                Réinitialiser
                            </Button>
                        </Col>
                    </Row>
                </Card>

                {/* Tableau des dossiers */}
                <Card
                    size="small"
                    title="Liste des dossiers"
                    extra={
                        <Tag color="blue">
                            {dossiers.total} dossier(s)
                        </Tag>
                    }
                    styles={{
                        body: {
                            padding: '0 12px 8px',
                        },
                    }}
                >
                    <Table
                        size="small"
                        rowKey="id"
                        columns={colonnes}
                        dataSource={dossiers.data}
                        locale={{
                            emptyText: (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description="Aucun dossier trouvé"
                                />
                            ),
                        }}
                        scroll={{ x: 750 }}
                        pagination={{
                            current: dossiers.current_page,
                            pageSize: dossiers.per_page,
                            total: dossiers.total,
                            showSizeChanger: false,
                            size: 'small',
                            showTotal: (total) =>
                                `${total} dossier(s)`,
                            onChange: (page) => {
                                router.get(
                                    '/dossiers',
                                    {
                                        ...construireParametres(),
                                        page,
                                    },
                                    {
                                        preserveState: true,
                                        preserveScroll: true,
                                    }
                                );
                            },
                        }}
                    />
                </Card>
            </Space>

            {/* Fenêtre des détails */}
            <Modal
                title="Détails du dossier"
                open={Boolean(dossierSelectionne)}
                onCancel={() => setDossierSelectionne(null)}
                footer={[
                    <Button
                        key="fermer"
                        onClick={() => setDossierSelectionne(null)}
                    >
                        Fermer
                    </Button>,
                ]}
                destroyOnHidden
            >
                {dossierSelectionne && (
                    <Descriptions
                        bordered
                        size="small"
                        column={1}
                    >
                        <Descriptions.Item label="Numéro BL">
                            {dossierSelectionne.numero_bl || '—'}
                        </Descriptions.Item>

                        <Descriptions.Item label="Date du dossier">
                            {formaterDate(
                                dossierSelectionne.date_dossier
                            )}
                        </Descriptions.Item>

                        <Descriptions.Item label="Client">
                            {dossierSelectionne.client || '—'}
                        </Descriptions.Item>

                        <Descriptions.Item label="Navire">
                            {dossierSelectionne.navire || '—'}
                        </Descriptions.Item>

                        <Descriptions.Item label="Nombre de documents">
                            {dossierSelectionne.documents_count ?? 0}
                        </Descriptions.Item>

                        <Descriptions.Item label="Date d'importation">
                            {formaterDateImportation(
                                dossierSelectionne.date_importation
                            )}
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}