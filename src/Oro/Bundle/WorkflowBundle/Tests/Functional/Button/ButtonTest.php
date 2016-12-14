<?php

namespace Oro\Bundle\WorkflowBundle\Tests\Functional\Button;

use Doctrine\ORM\EntityManager;

use Oro\Bundle\TestFrameworkBundle\Entity\WorkflowAwareEntity;
use Oro\Bundle\TestFrameworkBundle\Test\WebTestCase;
use Oro\Bundle\WorkflowBundle\Model\WorkflowManager;
use Oro\Bundle\WorkflowBundle\Tests\Functional\DataFixtures\LoadWorkflowDefinitions;

/**
 * @dbIsolation
 */
class ButtonTest extends WebTestCase
{
    /** @var WorkflowManager */
    private $workflowManager;

    /** @var WorkflowAwareEntity */
    private $entity;

    /** @var EntityManager */
    private $entityManager;

    /**
     * {@inheritdoc}
     */
    protected function setUp()
    {
        $this->initClient([], $this->generateBasicAuthHeader());
        $this->loadFixtures([LoadWorkflowDefinitions::class]);
        $this->entityManager = $this->client->getContainer()->get('doctrine')
            ->getManagerForClass(WorkflowAwareEntity::class);
        $this->workflowManager = $this->client->getContainer()->get('oro_workflow.manager');
        $this->workflowManager->activateWorkflow(LoadWorkflowDefinitions::MULTISTEP);
        $this->workflowManager->activateWorkflow(LoadWorkflowDefinitions::WITH_START_STEP);
        $this->workflowManager->activateWorkflow(LoadWorkflowDefinitions::WITH_INIT_OPTION);
        $this->entity = $this->createNewEntity();
    }

    /**
     * @dataProvider displayButtonsDataProvider
     *
     * @param array $context
     * @param array $expected
     */
    public function testDisplayButtons(array $context, array $expected = [], array $notExpected = [])
    {
        $crawler = $this->client->request(
            'GET',
            $this->getUrl('oro_action_widget_buttons', array_merge(['_widgetContainer' => 'dialog'], $context)),
            [],
            [],
            $this->generateBasicAuthHeader()
        );
        $response = $this->client->getResponse();
        $this->assertHtmlResponseStatusCodeEquals($response, 200);
        if (0 === count($expected)) {
            $this->assertEmpty($response->getContent());
        }
        foreach ($expected as $item) {
            $this->assertContains($item, $crawler->html());
        }
        foreach ($notExpected as $item) {
            $this->assertNotContains($item, $crawler->html());
        }
    }


    /**
     * @return array
     */
    public function displayButtonsDataProvider()
    {
        return [
            'empty context' => [
                'context' => [],
                'expected' => [],
            ],
            'entity context' => [
                'context' => ['entityClass' => 'entity1'],
                'expected' => [
                    'transition-test_start_init_option-start_transition_from_entities"',
                ],
                'notExpected' => [
                    'transition-test_start_init_option-start_transition_from_routes"',
                    'transition-test_start_init_option-start_transition_from_datagrids"',
                    'transition-test_start_step_flow-start_transition"',
                    'transition-test_start_init_option-start_transition"',
                ],
            ],
            'route context' => [
                'context' => ['route' => 'route1'],
                'expected' => [
                    'transition-test_start_init_option-start_transition_from_routes"',
                ],
                'notExpected' => [
                    'transition-test_start_init_option-start_transition_from_entities"',
                    'transition-test_start_init_option-start_transition_from_datagrids"',
                    'transition-test_start_step_flow-start_transition"',
                    'transition-test_start_init_option-start_transition"',
                ],
            ],
            'datagrid context' => [
                'context' => ['datagrid' => 'datagrid1'],
                'expected' => [
                    'transition-test_start_init_option-start_transition_from_datagrids"',
                ],
                'notExpected' => [
                    'transition-test_start_init_option-start_transition_from_entities"',
                    'transition-test_start_init_option-start_transition_from_routes"',
                    'transition-test_start_step_flow-start_transition"',
                    'transition-test_start_init_option-start_transition"',
                ],
            ],
            'entity and datagrid context' => [
                'context' => ['datagrid' => 'datagrid1', 'entityClass' => 'entity1'],
                'expected' => [
                    'transition-test_start_init_option-start_transition_from_datagrids"',
                    'transition-test_start_init_option-start_transition_from_entities"',
                ],
                'notExpected' => [
                    'transition-test_start_init_option-start_transition_from_routes"',
                    'transition-test_start_step_flow-start_transition"',
                    'transition-test_start_init_option-start_transition"',
                ],
            ],
            'not matched context' => [
                'context' => ['entityClass' => 'some_other_entity_class'],
                'expected' => [
                ],
            ],
        ];
    }

    /**
     * @return WorkflowAwareEntity
     */
    protected function createNewEntity()
    {
        $testEntity = new WorkflowAwareEntity();
        $testEntity->setName('test_' . uniqid('test', true));
        $this->entityManager->persist($testEntity);
        $this->entityManager->flush($testEntity);

        return $testEntity;
    }

}