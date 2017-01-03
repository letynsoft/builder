<?php

namespace VisualComposer\Helpers;

use VisualComposer\Framework\Illuminate\Support\Helper;

/**
 * Class Options.
 */
class Frontend implements Helper
{
    /**
     * @param $sourceId
     *
     * @return string
     */
    public function getFrontendUrl($sourceId)
    {
        $link = get_edit_post_link($sourceId);
        $question = (preg_match('/\?/', $link) ? '&' : '?');
        $query = [
            'vcv-action' => 'frontend',
            'vcv-source-id' => $sourceId,
        ];
        $frontendUrl = $link . $question . http_build_query($query);

        return $frontendUrl;
    }

    /**
     * @param $sourceId
     *
     * @return string
     */
    public function getEditableUrl($sourceId)
    {

        $link = get_permalink($sourceId);
        $question = (preg_match('/\?/', $link) ? '&' : '?');
        $query = [
            'vcv-editable' => '1',
            'vcv-nonce' => vchelper('Nonce')->admin(),
        ];

        $editableUrl = $link . $question . http_build_query($query);

        return $editableUrl;
    }
}
