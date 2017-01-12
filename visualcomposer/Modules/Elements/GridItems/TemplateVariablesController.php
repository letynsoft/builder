<?php

namespace VisualComposer\Modules\Elements\GridItems;

use VisualComposer\Framework\Container;
use VisualComposer\Framework\Illuminate\Support\Module;
use VisualComposer\Helpers\Traits\EventsFilters;

/**
 * Class TemplateVariablesController
 * @package VisualComposer\Modules\Elements\GridItems
 */
class TemplateVariablesController extends Container implements Module
{
    use EventsFilters;

    /**
     * TemplateVariablesController constructor.
     */
    public function __construct()
    {
        /** @see \VisualComposer\Modules\Elements\GridItems\TemplateVariablesController::templatePostVariables */
        $this->addFilter('vcv:elements:grid_item_template:variable:post_*', 'templatePostVariables');
        $this->addFilter('vcv:elements:grid_item_template:variable:post_author', 'postAuthor');
    }

    /**
     * @param $result
     * @param $data
     *
     * @return string
     */
    protected function templatePostVariables($result, $data)
    {
        $post = $data['payload']['post'];

        return isset($post->{$data['key']}) ? $post->{$data['key']} : '';
    }

    /**
     * @param $result
     * @param $data
     *
     * @return string
     */
    protected function postAuthor($result, $data)
    {
        $post = $data['payload']['post'];
        $author = get_userdata($post->post_author)->display_name;

        return $author;
    }
}
